import { appendPath } from '@celo/utils/lib/string'
import { formatJsonRpcError, formatJsonRpcResult, JsonRpcResult } from '@json-rpc-tools/utils'
import { Core } from '@walletconnect/core'
import '@walletconnect/react-native-compat'
import { SessionTypes } from '@walletconnect/types'
import { getSdkError, parseUri } from '@walletconnect/utils'
import { IWeb3Wallet, Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'
import { EventChannel, eventChannel } from 'redux-saga'
import {
  call,
  delay,
  put,
  race,
  select,
  spawn,
  take,
  takeEvery,
  takeLeading,
} from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnect2Properties } from 'src/analytics/Properties'
import { DappRequestOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import { getDappRequestOrigin } from 'src/app/utils'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import { WALLET_CONNECT_PROJECT_ID } from 'src/config'
import { activeDappSelector } from 'src/dapps/selectors'
import { ActiveDapp } from 'src/dapps/types'
import i18n from 'src/i18n'
import { isBottomSheetVisible, navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  CloseSession,
  DenyRequest,
  denyRequest,
  DenySession,
  initialiseClient,
  InitialisePairing,
  initialisePairing,
  removeExpiredSessions,
  sessionCreated,
  sessionDeleted,
  SessionPayload,
  sessionPayload,
  sessionProposal,
  SessionProposal,
  WalletConnectActions,
} from 'src/walletConnect/actions'
import {
  getDefaultRequestTrackedProperties,
  getDefaultSessionTrackedProperties as getDefaultSessionTrackedPropertiesAnalytics,
} from 'src/walletConnect/analytics'
import { isSupportedAction, SupportedActions } from 'src/walletConnect/constants'
import { handleRequest } from 'src/walletConnect/request'
import {
  selectHasPendingState,
  selectPendingActions,
  selectSessions,
} from 'src/walletConnect/selectors'
import { WalletConnectRequestType } from 'src/walletConnect/types'
import networkConfig from 'src/web3/networkConfig'
import { getWalletAddress } from 'src/web3/saga'

let client: IWeb3Wallet | null = null

const TAG = 'WalletConnect/saga'

const GET_SESSION_TIMEOUT = 10_000

export function* getDefaultSessionTrackedProperties(
  session: Web3WalletTypes.EventArguments['session_proposal'] | SessionTypes.Struct
) {
  const activeDapp: ActiveDapp | null = yield select(activeDappSelector)
  return getDefaultSessionTrackedPropertiesAnalytics(session, activeDapp)
}

function* handleInitialiseWalletConnect() {
  const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
    createWalletConnectChannel
  )
  while (true) {
    const message: WalletConnectActions = yield take(walletConnectChannel)
    yield put(message)
  }
}

// Though the WC types say `icons` is string[], we've seen buggy clients with no `icons` property
// so to avoid crashing the code depending on this, we fix it here
// Note: this method mutates the session
function applyIconFixIfNeeded(
  session: Web3WalletTypes.EventArguments['session_proposal'] | SessionTypes.Struct
) {
  const peer = 'params' in session ? session.params.proposer : session.peer
  const { icons } = peer?.metadata || {}
  if (peer?.metadata && (!Array.isArray(icons) || typeof icons[0] !== 'string' || !icons[0])) {
    peer.metadata.icons = []
  }
}

// Export for testing
export const _applyIconFixIfNeeded = applyIconFixIfNeeded

function* createWalletConnectChannel() {
  if (!client) {
    Logger.debug(TAG + '@createWalletConnectChannel', `init start`)
    client = yield call([Web3Wallet, 'init'], {
      core: new Core({
        projectId: WALLET_CONNECT_PROJECT_ID,
        relayUrl: networkConfig.walletConnectEndpoint,
      }),
      metadata: {
        name: APP_NAME,
        description: i18n.t('appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
        redirect: {
          native: 'celo://wallet/wc',
          universal: 'https://valoraapp.com/wc',
        },
      },
    })

    Logger.debug(TAG + '@createWalletConnectChannel', `init end`)
    yield put(clientInitialised())
  }

  return eventChannel((emit) => {
    const onSessionProposal = (session: Web3WalletTypes.EventArguments['session_proposal']) => {
      applyIconFixIfNeeded(session)
      emit(sessionProposal(session))
    }

    const onSessionDeleted = (session: Web3WalletTypes.EventArguments['session_delete']) => {
      emit(sessionDeleted(session))
    }
    const onSessionRequest = (request: Web3WalletTypes.EventArguments['session_request']) => {
      emit(sessionPayload(request))
    }

    if (!client) {
      return () => {
        Logger.debug(TAG + '@createWalletConnectChannel', 'missing client clean up')
      }
    }

    client.on('session_proposal', onSessionProposal)
    client.on('session_delete', onSessionDeleted)
    client.on('session_request', onSessionRequest)

    return async () => {
      if (!client) {
        Logger.debug(TAG + '@createWalletConnectChannel', 'clean up but missing client')
        return
      }

      Logger.debug(TAG + '@createWalletConnectChannel', 'clean up')

      client.off('session_proposal', onSessionProposal)
      client.off('session_delete', onSessionDeleted)
      client.off('session_request', onSessionRequest)

      const connections = client.getActiveSessions()
      await Promise.all(
        Object.keys(connections).map((topic) =>
          client!.disconnectSession({ topic, reason: getSdkError('USER_DISCONNECTED') })
        )
      )

      client = null
    }
  })
}

function* handleInitialisePairing({ uri, origin }: InitialisePairing) {
  const activeDapp: ActiveDapp | null = yield select(activeDappSelector)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_start, {
      dappRequestOrigin: getDappRequestOrigin(activeDapp),
      origin,
    })

    if (!client) {
      throw new Error('missing client')
    }

    Logger.debug(TAG + '@handleInitialisePairing', 'pair start')
    yield call([client, 'pair'], { uri })
    Logger.debug(TAG + '@handleInitialisePairing', 'pair end')
  } catch (e) {
    Logger.debug(TAG + '@handleInitialisePairing', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, {
      dappRequestOrigin: getDappRequestOrigin(activeDapp),
      error: e.message,
    })
  }
}

/**
 * When handling incoming requests (actions or sessions) we need to handle
 * them in order. That means if a request comes in, and we already have a
 * pending one, ignore it. Once a request is dealt with we handle the new
 * requests accordingly.
 */

function* handleIncomingSessionRequest({ session }: SessionProposal) {
  const { pending }: { pending: Web3WalletTypes.EventArguments['session_proposal'][] } =
    yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  yield call(showSessionRequest, session)
}

function* handleIncomingActionRequest({ request }: SessionPayload) {
  const pendingActions: Web3WalletTypes.EventArguments['session_request'][] = yield select(
    selectPendingActions
  )
  if (pendingActions.length > 1) {
    return
  }

  yield call(showActionRequest, request)
}

function* showSessionRequest(session: Web3WalletTypes.EventArguments['session_proposal']) {
  const activeDapp: ActiveDapp | null = yield select(activeDappSelector)
  ValoraAnalytics.track(WalletConnectEvents.wc_pairing_success, {
    dappRequestOrigin: activeDapp ? DappRequestOrigin.InAppWebView : DappRequestOrigin.External,
  })

  const defaultSessionTrackedProperties: WalletConnect2Properties = yield call(
    getDefaultSessionTrackedProperties,
    session
  )
  ValoraAnalytics.track(WalletConnectEvents.wc_session_propose, {
    ...defaultSessionTrackedProperties,
  })

  yield call(navigate, Screens.WalletConnectRequest, {
    type: WalletConnectRequestType.Session,
    pendingSession: session,
    version: 2,
  })
}

function* showActionRequest(request: Web3WalletTypes.EventArguments['session_request']) {
  if (!client) {
    throw new Error('missing client')
  }

  if (!isSupportedAction(request.params.request.method)) {
    // Directly deny unsupported requests
    yield put(denyRequest(request, getSdkError('WC_METHOD_UNSUPPORTED')))
    return
  }

  const session: SessionTypes.Struct = yield call(getSessionFromRequest, request)
  const defaultSessionTrackedProperties: WalletConnect2Properties = yield call(
    getDefaultSessionTrackedProperties,
    session
  )
  ValoraAnalytics.track(WalletConnectEvents.wc_request_propose, {
    ...defaultSessionTrackedProperties,
    ...getDefaultRequestTrackedProperties(request),
  })

  const activeSessions = yield call([client, 'getActiveSessions'])
  const activeSession = activeSessions[session.topic]
  if (!activeSession) {
    yield put(denyRequest(request, getSdkError('UNAUTHORIZED_EVENT')))
    return
  }

  yield call(navigate, Screens.WalletConnectRequest, {
    type: WalletConnectRequestType.Action,
    pendingAction: request,
    version: 2,
  })
}

export function* acceptSession({ session }: AcceptSession) {
  const defaultTrackedProperties: WalletConnect2Properties = yield call(
    getDefaultSessionTrackedProperties,
    session
  )
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('missing client')
    }

    const address: string = yield call(getWalletAddress)
    const { requiredNamespaces, relays, proposer } = session.params
    const namespaces: SessionTypes.Namespaces = {}
    Object.keys(requiredNamespaces).forEach((key) => {
      const accounts: string[] = []
      requiredNamespaces[key].chains?.map((chain) => {
        accounts.push(`${chain}:${address}`)
      })
      namespaces[key] = {
        accounts,
        methods: requiredNamespaces[key].methods,
        events: requiredNamespaces[key].events,
      }
    })

    yield call([client, 'approveSession'], {
      id: session.id,
      relayProtocol: relays[0].protocol,
      namespaces,
    })

    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_success, defaultTrackedProperties)

    // the Client does not emit any events when a new session value is
    // available, so if no matching session could be found we can wait and try again.
    const { timedOut, newSession } = yield race({
      timedOut: delay(GET_SESSION_TIMEOUT),
      newSession: call(getSessionFromClient, session),
    })

    if (timedOut) {
      throw new Error('No corresponding session could not be found on the client')
    }

    yield put(sessionCreated(newSession))
    yield call(showWalletConnectionSuccessMessage, proposer.metadata.name)
  } catch (e) {
    Logger.debug(TAG + '@acceptSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* getSessionFromClient(session: Web3WalletTypes.EventArguments['session_proposal']) {
  if (!client) {
    // should not happen
    throw new Error('missing client')
  }

  let sessionValue: null | SessionTypes.Struct = null
  while (!sessionValue) {
    const sessions: Record<string, SessionTypes.Struct> = yield call([client, 'getActiveSessions'])
    Object.values(sessions).forEach((entry) => {
      if (entry.pairingTopic === session.params.pairingTopic) {
        sessionValue = entry
      }
    })

    if (!sessionValue) {
      yield delay(500)
    }
  }

  applyIconFixIfNeeded(sessionValue)
  return sessionValue
}

function* denySession({ session }: DenySession) {
  const defaultTrackedProperties: WalletConnect2Properties = yield call(
    getDefaultSessionTrackedProperties,
    session
  )

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('missing client')
    }

    yield call([client, 'rejectSession'], {
      id: session.id,
      reason: getSdkError('USER_REJECTED_METHODS'),
    })

    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_success, defaultTrackedProperties)
  } catch (e) {
    Logger.debug(TAG + '@denySession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* getSessionFromRequest(request: Web3WalletTypes.EventArguments['session_request']) {
  if (!client) {
    // should not happen
    throw new Error('missing client')
  }
  // Active Sessions is an object with keys that are uuids
  const activeSessions = yield call([client, 'getActiveSessions'])
  const session = activeSessions[request.topic]

  if (!session) {
    // This should never happen
    throw new Error(`Unable to find WalletConnect session matching topic ${request.topic}`)
  }

  return session
}

function* handleAcceptRequest({ request }: AcceptRequest) {
  const session: SessionTypes.Struct = yield call(getSessionFromRequest, request)
  const defaultSessionTrackedProperties: WalletConnect2Properties = yield call(
    getDefaultSessionTrackedProperties,
    session
  )
  const defaultTrackedProperties = {
    ...defaultSessionTrackedProperties,
    ...getDefaultRequestTrackedProperties(request),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('Missing client')
    }

    const { topic, id, params } = request
    const activeSessions = yield call([client, 'getActiveSessions'])
    const activeSession = activeSessions[topic]

    if (!activeSession) {
      throw new Error(`Missing active session for topic ${topic}`)
    }

    const result = yield call(handleRequest, { ...params.request })
    const response: JsonRpcResult<string> = formatJsonRpcResult(
      id,
      params.request.method === SupportedActions.eth_signTransaction ? result.raw : result
    )
    yield call([client, 'respondSessionRequest'], { topic, response })

    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_success, defaultTrackedProperties)
    yield call(showWalletConnectionSuccessMessage, activeSession.peer.metadata.name)
  } catch (e) {
    Logger.debug(TAG + '@acceptRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* handleDenyRequest({ request, reason }: DenyRequest) {
  const session: SessionTypes.Struct = yield call(getSessionFromRequest, request)
  const defaultSessionTrackedProperties: WalletConnect2Properties = yield call(
    getDefaultSessionTrackedProperties,
    session
  )
  const defaultTrackedProperties = {
    ...defaultSessionTrackedProperties,
    ...getDefaultRequestTrackedProperties(request),
    denyReason: reason.message,
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('Missing client')
    }

    const { topic, id } = request
    const response = formatJsonRpcError(id, reason.message)
    yield call([client, 'respondSessionRequest'], { topic, response })
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_success, defaultTrackedProperties)
  } catch (e) {
    Logger.debug(TAG + '@denyRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* closeSession({ session }: CloseSession) {
  const defaultTrackedProperties: WalletConnect2Properties = yield call(
    getDefaultSessionTrackedProperties,
    session
  )

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('missing client')
    }

    yield call([client, 'disconnectSession'], {
      topic: session.topic,
      reason: getSdkError('USER_DISCONNECTED'),
    })

    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_success, defaultTrackedProperties)
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }
}

function* handlePendingStateOrNavigateBack() {
  const hasPendingState: boolean = yield select(selectHasPendingState)

  if (hasPendingState) {
    yield call(handlePendingState)
  } else if (yield call(isBottomSheetVisible, Screens.WalletConnectRequest)) {
    navigateBack()
  }
}

function* handlePendingState() {
  const {
    pending: [pendingSession],
  }: { pending: Web3WalletTypes.EventArguments['session_proposal'][] } = yield select(
    selectSessions
  )
  if (pendingSession) {
    yield call(showSessionRequest, pendingSession)
    return
  }

  const [pendingRequest]: Web3WalletTypes.EventArguments['session_request'][] = yield select(
    selectPendingActions
  )
  if (pendingRequest) {
    yield call(showActionRequest, pendingRequest)
  }
}

function* checkPersistedState() {
  yield put(removeExpiredSessions(Date.now() / 1000))

  const hasPendingState = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield put(initialiseClient())
    yield take(Actions.CLIENT_INITIALISED)
    yield call(handlePendingState)
    return
  }

  const { sessions }: { sessions: SessionTypes.Struct[] } = yield select(selectSessions)
  if (sessions.length) {
    yield put(initialiseClient())
  }
}

export function* walletConnectSaga() {
  yield takeLeading(Actions.INITIALISE_CLIENT, safely(handleInitialiseWalletConnect))
  yield takeEvery(Actions.INITIALISE_PAIRING, safely(handleInitialisePairing))
  yield takeEvery(Actions.CLOSE_SESSION, safely(closeSession))

  yield takeEvery(Actions.SESSION_PROPOSAL, safely(handleIncomingSessionRequest))
  yield takeEvery(Actions.ACCEPT_SESSION, safely(acceptSession))
  yield takeEvery(Actions.DENY_SESSION, safely(denySession))

  yield takeEvery(Actions.SESSION_PAYLOAD, safely(handleIncomingActionRequest))
  yield takeEvery(Actions.ACCEPT_REQUEST, safely(handleAcceptRequest))
  yield takeEvery(Actions.DENY_REQUEST, safely(handleDenyRequest))

  yield spawn(checkPersistedState)
}

export function* initialiseWalletConnectV2(uri: string, origin: WalletConnectPairingOrigin) {
  if (!client) {
    yield put(initialiseClient())
    yield take(Actions.CLIENT_INITIALISED)
  }
  yield put(initialisePairing(uri, origin))
}

export function* isWalletConnectEnabled(uri: string) {
  const { version } = parseUri(uri)
  const { v1, v2 }: { v1: boolean; v2: boolean } = yield select(walletConnectEnabledSelector)
  const versionEnabled: { [version: string]: boolean | undefined } = {
    '1': v1,
    '2': v2,
  }
  return versionEnabled[version] ?? false
}

export function* initialiseWalletConnect(uri: string, origin: WalletConnectPairingOrigin) {
  const walletConnectEnabled: boolean = yield call(isWalletConnectEnabled, uri)

  const { version } = parseUri(uri)
  if (!walletConnectEnabled) {
    Logger.debug('initialiseWalletConnect', `v${version} is disabled, ignoring`)
    return
  }

  switch (version) {
    case 2:
      yield call(initialiseWalletConnectV2, uri, origin)
      break
    case 1:
    default:
      throw new Error(`Unsupported WalletConnect version '${version}'`)
  }
}

export function* showWalletConnectionSuccessMessage(dappName: string) {
  const activeDapp = yield select(activeDappSelector)
  const successMessage = activeDapp
    ? i18n.t('inAppConnectionSuccess', { dappName })
    : i18n.t('connectionSuccess', { dappName })
  yield put(showMessage(successMessage))
}
