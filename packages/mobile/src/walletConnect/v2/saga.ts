import { appendPath } from '@celo/base'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { handleRequest } from 'src/walletConnect/request'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  CloseSession,
  DenyRequest,
  DenySession,
  initialiseClient,
  InitialisePairing,
  initialisePairing,
  sessionCreated,
  sessionDeleted,
  SessionPayload,
  sessionPayload,
  SessionProposal,
  sessionProposal,
  sessionUpdated,
  ShowRequestDetails,
  WalletConnectActions,
} from 'src/walletConnect/v2/actions'
import {
  selectHasPendingState,
  selectPendingActions,
  selectSessions,
} from 'src/walletConnect/v2/selectors'
import { getWalletAddress } from 'src/web3/saga'
import { CLIENT_EVENTS, default as WalletConnectClient } from 'walletconnect-v2/client'
import { SessionTypes } from 'walletconnect-v2/types'
import { Error as WalletConnectError, ERROR as WalletConnectErrors } from 'walletconnect-v2/utils'

const TAG = 'WalletConnect/saga'

let client: WalletConnectClient | null = null

function getDefaultSessionTrackedProperties(
  session: SessionTypes.Proposal | SessionTypes.Created | SessionTypes.Settled
) {
  const peer = 'proposer' in session ? session.proposer : session.peer
  const { name: dappName, url: dappUrl, description: dappDescription, icons } = peer.metadata
  const {
    blockchain: { chains: permissionsBlockchains },
    jsonrpc: { methods: permissionsJsonrpcMethods },
    notifications: { types: permissionsNotificationsTypes },
  } = session.permissions
  const { protocol: relayProtocol } = session.relay
  return {
    version: 2 as const,
    dappName,
    dappUrl,
    dappDescription,
    dappIcon: icons[0],
    permissionsBlockchains,
    permissionsJsonrpcMethods,
    permissionsNotificationsTypes,
    relayProtocol,
  }
}

function getDefaultRequestTrackedProperties(request: SessionTypes.RequestEvent) {
  const { id: requestId, jsonrpc: requestJsonrpc, method: requestMethod } = request.request
  return {
    requestChainId: request.chainId,
    requestId,
    requestJsonrpc,
    requestMethod,
  }
}

function* getSessionFromRequest(request: SessionTypes.RequestEvent) {
  const { sessions }: { sessions: SessionTypes.Created[] } = yield select(selectSessions)
  const session = sessions.find((s) => s.topic === request.topic)
  if (!session) {
    // This should never happen
    throw new Error(`Unable to find WalletConnect session matching topic ${request.topic}`)
  }

  return session
}

function* acceptSession({ session }: AcceptSession) {
  const defautTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_start, defautTrackedProperties)
    if (!client) {
      throw new Error('missing client')
    }

    const address: string = yield call(getWalletAddress)
    const response: SessionTypes.Response = {
      metadata: {
        name: APP_NAME,
        description: i18n.t('global:appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
      state: {
        // just covering the range of possibly accepted
        // addresses in CAIP formats
        accounts: [
          // short name mapping https://github.com/ethereum-lists/chains/issues/359
          `celo:${address}`,
          // CAIP 50 https://github.com/ChainAgnostic/CAIPs/pull/50
          `${address}@celo:${networkConfig.networkId}`,
          `${address}@eip155:${networkConfig.networkId}`,
          // CAIP 10 https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md
          `celo:${networkConfig.networkId}:${address}`,
          `eip155:${networkConfig.networkId}:${address}`,
        ],
      },
    }

    yield call(client.approve.bind(client), { proposal: session, response })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_success, defautTrackedProperties)
    yield put(
      showMessage(
        i18n.t('walletConnect:connectionSuccess', { dappName: session.proposer.metadata.name })
      )
    )
  } catch (e: any) {
    Logger.debug(TAG + '@acceptSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* denySession({ session }: DenySession) {
  const defautTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_start, defautTrackedProperties)
    if (!client) {
      throw new Error('missing client')
    }
    yield call(client.reject.bind(client), {
      reason: WalletConnectErrors.NOT_APPROVED.format(),
      proposal: session,
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_success, defautTrackedProperties)
  } catch (e) {
    Logger.debug(TAG + '@denySession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* closeSession({ session }: CloseSession) {
  const defautTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_start, defautTrackedProperties)
    if (!client) {
      throw new Error('missing client')
    }
    yield call(client.disconnect.bind(client), {
      topic: session.topic,
      reason: WalletConnectErrors.USER_DISCONNECTED.format(),
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_success, defaultTrackedProperties)
  } catch (e: any) {
    Logger.debug(TAG + '@closeSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }
}

function* handlePendingStateOrNavigateBack() {
  const hasPendingState: boolean = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield call(handlePendingState)
  } else {
    navigateHome()
  }
}

function* showRequestDetails({ request, infoString }: ShowRequestDetails): any {
  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  ValoraAnalytics.track(WalletConnectEvents.wc_request_details, {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  })

  // TODO: this is a short lived alternative to proper
  // transaction decoding.
  yield call(navigate, Screens.DappKitTxDataScreen, { dappKitData: infoString })
}

function* acceptRequest({ request }: AcceptRequest): any {
  const {
    request: { id, jsonrpc, method, params },
    topic,
  } = request

  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  const defautTrackedProperties = {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_start, defautTrackedProperties)

    if (!client) {
      throw new Error('Missing client')
    }

    let result: any
    let error: WalletConnectError | undefined

    try {
      result = yield call(handleRequest, { method, params })
    } catch (e: any) {
      Logger.debug(TAG + '@acceptRequest error obtaining result: ', e.message)
      // TODO: WalletConnectErrors.JSONRPC_REQUEST_METHOD_UNSUPPORTED
      error = WalletConnectErrors.GENERIC
    }

    const partialResponse = { id, jsonrpc }
    const response =
      result !== undefined
        ? { ...partialResponse, result }
        : { ...partialResponse, error: error!.format() }

    yield call(client.respond.bind(client), {
      topic,
      response,
    })
    if (error) {
      ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
        ...defautTrackedProperties,
        error: error.type,
      })
    } else {
      yield put(
        showMessage(
          i18n.t('walletConnect:connectionSuccess', { dappName: session.peer.metadata.name })
        )
      )
      ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_success, defautTrackedProperties)
    }
  } catch (e: any) {
    Logger.debug(TAG + '@acceptRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* denyRequest({ request }: DenyRequest) {
  const {
    request: { id, jsonrpc },
    topic,
  } = request

  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  const defautTrackedProperties = {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_start, defautTrackedProperties)

    if (!client) {
      throw new Error('Missing client')
    }

    yield call(client.respond.bind(client), {
      topic,
      response: {
        id,
        jsonrpc,
        error: WalletConnectErrors.DISAPPROVED_JSONRPC.format(),
      },
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_success, defaultTrackedProperties)
  } catch (e: any) {
    Logger.debug(TAG + '@denyRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
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
    client = yield call(WalletConnectClient.init as any, {
      relayProvider: networkConfig.walletConnectEndpoint,
      storageOptions: {
        asyncStorage: AsyncStorage,
      },
      logger: 'error',
      controller: true,
    })
    Logger.debug(TAG + '@createWalletConnectChannel', `init end`)
    yield put(clientInitialised())
  }

  return eventChannel((emit: any) => {
    const onSessionProposal = (session: SessionTypes.Proposal) => emit(sessionProposal(session))
    const onSessionCreated = (session: SessionTypes.Created) => emit(sessionCreated(session))
    const onSessionUpdated = (session: SessionTypes.UpdateParams) => emit(sessionUpdated(session))
    const onSessionDeleted = (session: SessionTypes.DeleteParams) => emit(sessionDeleted(session))
    const onSessionRequest = (request: SessionTypes.RequestEvent) => emit(sessionPayload(request))

    if (!client) {
      return () => {
        Logger.debug(TAG + '@createWalletConnectChannel', 'missing client clean up')
      }
    }

    client.on(CLIENT_EVENTS.session.proposal, onSessionProposal)
    client.on(CLIENT_EVENTS.session.created, onSessionCreated)
    client.on(CLIENT_EVENTS.session.updated, onSessionUpdated)
    client.on(CLIENT_EVENTS.session.deleted, onSessionDeleted)
    client.on(CLIENT_EVENTS.session.request, onSessionRequest)

    return () => {
      if (!client) {
        Logger.debug(TAG + '@createWalletConnectChannel', 'clean up but missing client')
        return
      }

      Logger.debug(TAG + '@createWalletConnectChannel', 'clean up')

      client.off(CLIENT_EVENTS.session.proposal, onSessionProposal)
      client.off(CLIENT_EVENTS.session.created, onSessionCreated)
      client.off(CLIENT_EVENTS.session.updated, onSessionUpdated)
      client.off(CLIENT_EVENTS.session.deleted, onSessionDeleted)
      client.off(CLIENT_EVENTS.session.request, onSessionRequest)

      const reason = WalletConnectErrors.EXPIRED.format()
      client.session.topics.map((topic) => client!.disconnect({ reason, topic }))
      client = null
    }
  })
}

function* showSessionRequest(session: SessionTypes.Proposal) {
  ValoraAnalytics.track(WalletConnectEvents.wc_pairing_success)
  ValoraAnalytics.track(WalletConnectEvents.wc_session_propose, {
    ...getDefaultSessionTrackedProperties(session),
  })

  yield call(navigate, Screens.WalletConnectSessionRequest, { version: 2, session })
}

function* showActionRequest(request: SessionTypes.RequestEvent) {
  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  ValoraAnalytics.track(WalletConnectEvents.wc_request_propose, {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  })

  const { name: dappName, url: dappUrl, icons } = session.peer.metadata
  yield call(navigate, Screens.WalletConnectActionRequest, {
    version: 2,
    action: request,
    dappName,
    dappUrl,
    dappIcon: icons[0],
  })
}

/**
 * When handling incoming requests (actions or sessions) we need to handle
 * them in order. That means if a request comes in, and we already have a
 * pending one, ignore it. Once a request is dealt with we handle the new
 * requests accordingly.
 */

function* handleIncomingSessionRequest({ session }: SessionProposal) {
  const { pending }: { pending: SessionTypes.Proposal[] } = yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  yield call(showSessionRequest, session)
}
function* handleIncomingActionRequest({ request }: SessionPayload) {
  const pendingActions: SessionTypes.RequestEvent[] = yield select(selectPendingActions)
  if (pendingActions.length > 1) {
    return
  }

  yield call(showActionRequest, request)
}

function* handleInitialisePairing({ uri, origin }: InitialisePairing) {
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_start, {
      origin,
    })
    if (!client) {
      throw new Error('missing client')
    }

    Logger.debug(TAG + '@handleInitialisePairing', 'pair start')
    yield call(client.pair.bind(client), { uri })
    Logger.debug(TAG + '@handleInitialisePairing', 'pair end')
  } catch (e: any) {
    Logger.debug(TAG + '@handleInitialisePairing', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, { error: e.message })
  }
}

function* handlePendingState(): any {
  const {
    pending: [session],
  }: { pending: SessionTypes.Proposal[] } = yield select(selectSessions)
  if (session) {
    yield call(showSessionRequest, session)
    return
  }

  const [request] = yield select(selectPendingActions)
  if (request) {
    yield call(showActionRequest, request)
  }
}

function* checkPersistedState(): any {
  const hasPendingState = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield put(initialiseClient())
    yield call(handlePendingState)
    return
  }

  const { sessions }: { sessions: SessionTypes.Created[] } = yield select(selectSessions)
  if (sessions.length) {
    yield put(initialiseClient())
  }
}

export function* walletConnectV2Saga() {
  yield takeLeading(Actions.INITIALISE_CLIENT, handleInitialiseWalletConnect)
  yield takeEvery(Actions.INITIALISE_PAIRING, handleInitialisePairing)

  yield takeEvery(Actions.ACCEPT_SESSION, acceptSession)
  yield takeEvery(Actions.DENY_SESSION, denySession)
  yield takeEvery(Actions.CLOSE_SESSION, closeSession)
  yield takeEvery(Actions.SHOW_REQUEST_DETAILS, showRequestDetails)
  yield takeEvery(Actions.ACCEPT_REQUEST, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST, denyRequest)

  yield takeEvery(Actions.SESSION_PROPOSAL, handleIncomingSessionRequest)
  yield takeEvery(Actions.SESSION_PAYLOAD, handleIncomingActionRequest)

  yield call(checkPersistedState)
}

export function* initialiseWalletConnectV2(uri: string, origin: WalletConnectPairingOrigin) {
  if (!client) {
    yield put(initialiseClient())
    yield take(Actions.CLIENT_INITIALISED)
  }
  yield put(initialisePairing(uri, origin))
}
