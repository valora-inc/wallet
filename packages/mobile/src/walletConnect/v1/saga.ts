import { appendPath } from '@celo/base'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, fork, put, select, take, takeEvery } from 'redux-saga/effects'
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
import { isSupportedAction } from 'src/walletConnect/constants'
import { handleRequest } from 'src/walletConnect/request'
import {
  WalletConnectPayloadRequest,
  WalletConnectSession,
  WalletConnectSessionRequest,
} from 'src/walletConnect/types'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  CloseSession,
  DenyRequest,
  InitialiseConnection,
  initialiseConnection,
  PayloadRequest,
  payloadRequest,
  sessionDeleted,
  SessionRequest,
  sessionRequest,
  ShowRequestDetails,
  storeSession,
  WalletConnectActions,
} from 'src/walletConnect/v1/actions'
import { PendingAction } from 'src/walletConnect/v1/reducer'
import {
  selectHasPendingState,
  selectPendingActions,
  selectSessions,
} from 'src/walletConnect/v1/selectors'
import { getWalletAddress } from 'src/web3/saga'
import { default as WalletConnectClient } from 'walletconnect-v1/client'
import { IWalletConnectOptions } from 'walletconnect-v1/types'

const connectors: { [x: string]: WalletConnectClient | undefined } = {}

const TAG = 'WalletConnect/saga-v1'

function getDefaultSessionTrackedProperties(
  session: WalletConnectSessionRequest | WalletConnectSession
) {
  const { peerId, peerMeta, chainId } = 'peerMeta' in session ? session : session.params[0]
  const { name: dappName, url: dappUrl, description: dappDescription, icons } = peerMeta!
  return {
    version: 1 as const,
    dappName,
    dappUrl,
    dappDescription,
    dappIcon: icons[0],
    peerId,
    chainId: chainId?.toString() ?? '',
  }
}

function getDefaultRequestTrackedProperties(request: WalletConnectPayloadRequest, chainId: number) {
  const { id: requestId, jsonrpc: requestJsonrpc, method: requestMethod } = request
  return {
    requestChainId: chainId.toString(),
    requestId,
    requestJsonrpc,
    requestMethod,
  }
}

function* getSessionFromPeerId(peerId: string) {
  const { sessions }: { sessions: WalletConnectSession[] } = yield select(selectSessions)
  const session = sessions.find((s) => s.peerId === peerId)
  if (!session) {
    // This should never happen
    throw new Error(`Unable to find WalletConnect session matching peerId ${peerId}`)
  }

  return session
}

function* acceptSession(session: AcceptSession) {
  Logger.debug(TAG + '@acceptSession', 'Starting to accept session request', session)
  const defaultTrackedProperties = getDefaultSessionTrackedProperties(session.session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_start, defaultTrackedProperties)
    const { peerId, peerMeta } = session.session.params[0]
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }

    const account: string = yield call(getWalletAddress)
    const sessionData = {
      accounts: [account],
      chainId: parseInt(networkConfig.networkId),
      // TODO: passing `rpcUrl` doesn't work yet and we had to patch PoolTogether
      // providing the celo rpc urls to make it work (see https://github.com/pooltogether/pooltogether-hooks/pull/9)
      // but this should be the long term solution
      // rpcUrl: DEFAULT_FORNO_URL,
    }
    connector.approveSession(sessionData)
    connector.updateSession(sessionData)
    yield put(storeSession(connector.session))
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_success, defaultTrackedProperties)
    yield put(showMessage(i18n.t('walletConnect:connectionSuccess', { dappName: peerMeta.name })))
  } catch (e) {
    Logger.debug(TAG + '@acceptSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }
  yield call(handlePendingStateOrNavigateBack)
}

function* denySession({ session }: AcceptSession) {
  const defaultTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_start, defaultTrackedProperties)
    const { peerId } = session.params[0]
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }

    connector.rejectSession()
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

function* closeSession({ session }: CloseSession) {
  const defaultTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_start, defaultTrackedProperties)
    const { peerId } = session
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }

    yield call([connector, connector.killSession])
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_success, defaultTrackedProperties)
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }
}

function* showRequestDetails({ request, peerId, infoString }: ShowRequestDetails): any {
  const session: WalletConnectSession = yield call(getSessionFromPeerId, peerId)
  ValoraAnalytics.track(WalletConnectEvents.wc_request_details, {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request, session.chainId),
  })

  // TODO: this is a short lived alternative to proper
  // transaction decoding.
  yield call(navigate, Screens.DappKitTxDataScreen, { dappKitData: infoString })
}

function* acceptRequest(r: AcceptRequest) {
  const { peerId, request } = r
  const { id, jsonrpc, method, params } = request
  const connector = connectors[peerId]

  const session: WalletConnectSession = yield call(getSessionFromPeerId, peerId)
  const defaultTrackedProperties = {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request, session.chainId),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_start, defaultTrackedProperties)
    if (!connector) {
      throw new Error('missing connector')
    }
    const result: string = yield call(handleRequest, { method, params })
    connector.approveRequest({ id, jsonrpc, result })
    yield put(
      showMessage(
        i18n.t('walletConnect:connectionSuccess', { dappName: connector?.session?.peerMeta?.name })
      )
    )
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_success, defaultTrackedProperties)
  } catch (e) {
    Logger.debug(TAG + '@acceptRequest', e.message)
    connector?.rejectRequest({ id, jsonrpc, error: e.message })
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* denyRequest(r: DenyRequest) {
  const { peerId, request } = r

  const { id } = request

  const session: WalletConnectSession = yield call(getSessionFromPeerId, peerId)
  const defaultTrackedProperties = {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request, session.chainId),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_start, defaultTrackedProperties)

    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }
    connector.rejectRequest({ id, error: { message: '' } })
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_success, defaultTrackedProperties)
  } catch (e) {
    Logger.debug(TAG + '@denyRequest', e?.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* handleInitialiseWalletConnect({ uri, origin }: InitialiseConnection) {
  ValoraAnalytics.track(WalletConnectEvents.wc_pairing_start, {
    origin,
  })
  const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
    createWalletConnectChannelWithArgs,
    { uri }
  )
  yield fork(listenForWalletConnectMessages, walletConnectChannel)
}

function* listenForWalletConnectMessages(walletConnectChannel: EventChannel<WalletConnectActions>) {
  while (true) {
    const message: WalletConnectActions = yield take(walletConnectChannel)
    yield put(message)
  }
}

// eslint-disable-next-line require-yield
function* createWalletConnectChannelWithArgs(connectorOpts: IWalletConnectOptions) {
  Logger.info(
    TAG + '@createWalletConnectChannelWithArgs',
    'Creating Wallet',
    JSON.stringify(connectorOpts)
  )
  return eventChannel((emit: any) => {
    const connector = new WalletConnectClient({
      ...connectorOpts,
      clientMeta: {
        name: APP_NAME,
        description: i18n.t('global:appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
    })
    // This if might not be needed/desired.
    if (connectorOpts?.session?.peerId) {
      connectors[connectorOpts.session.peerId] = connector
    }
    connector.on('session_request', (error: any, payload: WalletConnectSessionRequest) => {
      const peerId = payload.params[0].peerId
      connectors[peerId] = connector
      payload.uri = connectorOpts.uri
      emit(sessionRequest(peerId, payload))
    })
    connector.on('call_request', (error: any, payload: WalletConnectPayloadRequest) => {
      if (isSupportedAction(payload.method)) {
        emit(payloadRequest(connector.peerId, payload))
      } else {
        // TODO: Doing nothing will cause the user to see the timeout screen.
        // This isn't expected to happen so it's fine for now, but we could
        // redirect user to another screen if they're in the loading screen
        // at this point.
        ValoraAnalytics.track(WalletConnectEvents.wc_unknown_action, { method: payload.method })
      }
    })
    connector.on('disconnect', () => {
      emit(sessionDeleted(connector.peerId))
    })

    return () => {
      connector!.off('session_request')
      connector!.off('call_request')
      connector!
        .killSession()
        .catch((error) =>
          Logger.error(
            TAG + '@createWalletConnectChannelWithArgs',
            'Error trying to kill the session',
            error
          )
        )
    }
  })
}

function* showSessionRequest(session: WalletConnectSessionRequest) {
  ValoraAnalytics.track(WalletConnectEvents.wc_pairing_success)
  ValoraAnalytics.track(WalletConnectEvents.wc_session_propose, {
    ...getDefaultSessionTrackedProperties(session),
  })

  yield call(navigate, Screens.WalletConnectSessionRequest, { version: 1, session })
}

function* showActionRequest({ action: request, peerId }: PendingAction) {
  const session: WalletConnectSession = yield call(getSessionFromPeerId, peerId)
  ValoraAnalytics.track(WalletConnectEvents.wc_request_propose, {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request, session.chainId),
  })

  const { name: dappName, url: dappUrl, icons } = session.peerMeta!
  yield call(navigate, Screens.WalletConnectActionRequest, {
    version: 1,
    peerId,
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

function* handleSessionRequest({ session }: SessionRequest) {
  const { pending }: { pending: WalletConnectSessionRequest[] } = yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  yield call(showSessionRequest, session)
}
function* handlePayloadRequest(action: PayloadRequest) {
  const pendingActions: PendingAction[] = yield select(selectPendingActions)
  if (pendingActions.length > 1) {
    return
  }

  yield call(showActionRequest, { action: action.request, peerId: action.peerId })
}

function* handlePendingStateOrNavigateBack() {
  const hasPendingState: boolean = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield call(handlePendingState)
  } else {
    navigateHome()
  }
}

function* handlePendingState(): any {
  const {
    pending: [session],
  }: {
    pending: WalletConnectSessionRequest[]
  } = yield select(selectSessions)

  if (session) {
    yield call(showSessionRequest, session)
    return
  }

  const [action]: PendingAction[] = yield select(selectPendingActions)
  if (action) {
    yield call(showActionRequest, action)
  }
}

function* checkPersistedState(): any {
  const { sessions }: { sessions: WalletConnectSession[] } = yield select(selectSessions)

  for (const session of sessions) {
    try {
      const connector = connectors[session.peerId]
      // @ts-ignore
      const connectorConnected = connector?._transport.connected
      if (!connectorConnected) {
        // @ts-ignore
        if (connector?._eventManager) {
          // @ts-ignore
          connector._eventManager = null
        }

        const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
          createWalletConnectChannelWithArgs,
          { session }
        )
        yield fork(listenForWalletConnectMessages, walletConnectChannel)
      }
    } catch (error) {
      Logger.debug(TAG + '@checkPersistedState', error)
    }
  }

  yield call(handlePendingState)
}

export function* walletConnectV1Saga() {
  yield takeEvery(Actions.INITIALISE_CONNECTION_V1, handleInitialiseWalletConnect)

  yield takeEvery(Actions.ACCEPT_SESSION_V1, acceptSession)
  yield takeEvery(Actions.DENY_SESSION_V1, denySession)
  yield takeEvery(Actions.CLOSE_SESSION_V1, closeSession)
  yield takeEvery(Actions.SHOW_REQUEST_DETAILS_V1, showRequestDetails)
  yield takeEvery(Actions.ACCEPT_REQUEST_V1, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST_V1, denyRequest)

  yield takeEvery(Actions.SESSION_V1, handleSessionRequest)
  yield takeEvery(Actions.PAYLOAD_V1, handlePayloadRequest)

  yield call(checkPersistedState)
}

export function* initialiseWalletConnectV1(uri: string, origin: WalletConnectPairingOrigin) {
  yield put(initialiseConnection(uri, origin))
}
