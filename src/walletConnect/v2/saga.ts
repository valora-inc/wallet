import { appendPath } from '@celo/utils/lib/string'
import { formatJsonRpcError, formatJsonRpcResult, JsonRpcResult } from '@json-rpc-tools/utils'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import SignClient from '@walletconnect/sign-client'
import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, delay, put, race, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnect2Properties } from 'src/analytics/Properties'
import { DappRequestOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { getDappRequestOrigin } from 'src/app/utils'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import { WALLET_CONNECT_PROJECT_ID } from 'src/config'
import { activeDappSelector } from 'src/dapps/selectors'
import { ActiveDapp } from 'src/dapps/types'
import i18n from 'src/i18n'
import { isBottomSheetVisible, navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { getDefaultSessionTrackedPropertiesV2 } from 'src/walletConnect/analytics'
import { isSupportedAction, SupportedActions } from 'src/walletConnect/constants'
import { handleRequest } from 'src/walletConnect/request'
import { showWalletConnectionSuccessMessage } from 'src/walletConnect/saga'
import { WalletConnectRequestType } from 'src/walletConnect/types'
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
  SessionProposal,
  sessionProposal,
  sessionUpdated,
  WalletConnectActions,
} from 'src/walletConnect/v2/actions'
import {
  selectHasPendingState,
  selectPendingActions,
  selectSessions,
} from 'src/walletConnect/v2/selectors'
import networkConfig from 'src/web3/networkConfig'
import { getWalletAddress } from 'src/web3/saga'

let client: SignClient | null = null

const TAG = 'WalletConnect/saga'

const GET_SESSION_TIMEOUT = 10_000

export function* getDefaultSessionTrackedProperties(
  session: SignClientTypes.EventArguments['session_proposal'] | SessionTypes.Struct
) {
  const activeDapp: ActiveDapp | null = yield select(activeDappSelector)
  return getDefaultSessionTrackedPropertiesV2(session, activeDapp)
}

function getDefaultRequestTrackedProperties(
  request: SignClientTypes.EventArguments['session_request']
) {
  const { id, params } = request
  return {
    requestChainId: params.chainId,
    requestId: id,
    requestJsonrpc: params.request.params.toString(),
    requestMethod: params.request.method,
  }
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

function* createWalletConnectChannel() {
  if (!client) {
    Logger.debug(TAG + '@createWalletConnectChannel', `init start`)

    client = yield call([SignClient, 'init'], {
      logger: 'debug',
      projectId: WALLET_CONNECT_PROJECT_ID,
      relayUrl: networkConfig.walletConnectEndpoint,
      metadata: {
        name: APP_NAME,
        description: i18n.t('appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
    })

    Logger.debug(TAG + '@createWalletConnectChannel', `init end`)
    yield put(clientInitialised())
  }

  return eventChannel((emit) => {
    const onSessionProposal = (session: SignClientTypes.EventArguments['session_proposal']) => {
      emit(sessionProposal(session))
    }

    const onSessionUpdated = (session: SignClientTypes.EventArguments['session_update']) => {
      emit(sessionUpdated(session))
    }
    const onSessionDeleted = (session: SignClientTypes.EventArguments['session_delete']) => {
      emit(sessionDeleted(session))
    }
    const onSessionRequest = (request: SignClientTypes.EventArguments['session_request']) => {
      emit(sessionPayload(request))
    }

    if (!client) {
      return () => {
        Logger.debug(TAG + '@createWalletConnectChannel', 'missing client clean up')
      }
    }

    client.on('session_proposal', onSessionProposal)
    client.on('session_update', onSessionUpdated)
    client.on('session_delete', onSessionDeleted)
    client.on('session_request', onSessionRequest)

    return async () => {
      if (!client) {
        Logger.debug(TAG + '@createWalletConnectChannel', 'clean up but missing client')
        return
      }

      Logger.debug(TAG + '@createWalletConnectChannel', 'clean up')

      client.off('session_proposal', onSessionProposal)
      client.off('session_update', onSessionUpdated)
      client.off('session_delete', onSessionDeleted)
      client.off('session_request', onSessionRequest)

      const connections = client.pairing.values
      await Promise.all(
        connections.map((connection) =>
          client!.disconnect({ topic: connection.topic, reason: getSdkError('USER_DISCONNECTED') })
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
  const { pending }: { pending: SignClientTypes.EventArguments['session_proposal'][] } =
    yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  yield call(showSessionRequest, session)
}

function* handleIncomingActionRequest({ request }: SessionPayload) {
  const pendingActions: SignClientTypes.EventArguments['session_request'][] = yield select(
    selectPendingActions
  )
  if (pendingActions.length > 1) {
    return
  }

  yield call(showActionRequest, request)
}

function* showSessionRequest(session: SignClientTypes.EventArguments['session_proposal']) {
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

function* showActionRequest(request: SignClientTypes.EventArguments['session_request']) {
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

  const activeSession = client.session.values.find((value) => value.topic === request.topic)
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
      requiredNamespaces[key].chains.map((chain) => {
        accounts.push(`${chain}:${address}`)
      })
      namespaces[key] = {
        accounts,
        methods: requiredNamespaces[key].methods,
        events: requiredNamespaces[key].events,
      }
    })

    const { acknowledged } = yield call([client, 'approve'], {
      id: session.id,
      relayProtocol: relays[0].protocol,
      namespaces,
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_success, defaultTrackedProperties)

    yield call(acknowledged)

    // the SignClient does not emit any events when a new session value is
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

function* getSessionFromClient(session: SignClientTypes.EventArguments['session_proposal']) {
  if (!client) {
    // should not happen
    throw new Error('missing client')
  }

  let sessionValue = client.session.values.find(
    (value) => value.peer.publicKey === session.params.proposer.publicKey
  )

  while (!sessionValue) {
    yield delay(500)
    sessionValue = client.session.values.find(
      (value) => value.peer.publicKey === session.params.proposer.publicKey
    )
  }

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

    yield call([client, 'reject'], {
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

function* getSessionFromRequest(request: SignClientTypes.EventArguments['session_request']) {
  const { sessions }: { sessions: SessionTypes.Struct[] } = yield select(selectSessions)
  const session = sessions.find((s) => s.topic === request.topic)
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
    const activeSession = client.session.values.find((value) => value.topic === request.topic)
    if (!activeSession) {
      throw new Error(`Missing active session for topic ${topic}`)
    }

    const result = yield call(handleRequest, { ...params.request })
    const response: JsonRpcResult<string> = formatJsonRpcResult(
      id,
      params.request.method === SupportedActions.eth_signTransaction ? result.raw : result
    )
    yield call([client, 'respond'], { topic, response })

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
    yield call([client, 'respond'], { topic, response })
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

    yield call([client, 'disconnect'], {
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
  }: { pending: SignClientTypes.EventArguments['session_proposal'][] } = yield select(
    selectSessions
  )
  if (pendingSession) {
    yield call(showSessionRequest, pendingSession)
    return
  }

  const [pendingRequest]: SignClientTypes.EventArguments['session_request'][] = yield select(
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
    yield take(Actions.CLIENT_INITIALISED_V2)
    yield call(handlePendingState)
    return
  }

  const { sessions }: { sessions: SessionTypes.Struct[] } = yield select(selectSessions)
  if (sessions.length) {
    yield put(initialiseClient())
  }
}

export function* walletConnectV2Saga() {
  yield takeLeading(Actions.INITIALISE_CLIENT_V2, handleInitialiseWalletConnect)
  yield takeEvery(Actions.INITIALISE_PAIRING_V2, handleInitialisePairing)
  yield takeEvery(Actions.CLOSE_SESSION_V2, closeSession)

  yield takeEvery(Actions.SESSION_PROPOSAL_V2, handleIncomingSessionRequest)
  yield takeEvery(Actions.ACCEPT_SESSION_V2, acceptSession)
  yield takeEvery(Actions.DENY_SESSION_V2, denySession)

  yield takeEvery(Actions.SESSION_PAYLOAD_V2, handleIncomingActionRequest)
  yield takeEvery(Actions.ACCEPT_REQUEST_V2, handleAcceptRequest)
  yield takeEvery(Actions.DENY_REQUEST_V2, handleDenyRequest)

  yield call(checkPersistedState)
}

export function* initialiseWalletConnectV2(uri: string, origin: WalletConnectPairingOrigin) {
  if (!client) {
    yield put(initialiseClient())
    yield take(Actions.CLIENT_INITIALISED_V2)
  }
  yield put(initialisePairing(uri, origin))
}
