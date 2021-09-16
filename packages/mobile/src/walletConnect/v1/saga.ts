import { appendPath } from '@celo/base'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, fork, put, select, take, takeEvery } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
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
  storeSession,
  WalletConnectActions,
} from 'src/walletConnect/v1/actions'
import { PendingAction } from 'src/walletConnect/v1/reducer'
import {
  selectHasPendingState,
  selectPendingActions,
  selectSessions,
} from 'src/walletConnect/v1/selectors'
import { getAccountAddress } from 'src/web3/saga'
import { default as WalletConnectClient } from 'walletconnect-v1/client'

const connectors: { [x: string]: WalletConnectClient | undefined } = {}

const TAG = 'WalletConnect/saga-v1'

export function getConnectorMetadata(peerId: string) {
  if (!connectors[peerId]) {
    return null
  }
  return connectors[peerId]!.peerMeta
}

export function* acceptSession(session: AcceptSession) {
  Logger.debug(TAG + '@acceptSession', 'Starting to accept session request', session)
  const { peerId, peerMeta } = session.session.params[0]
  const connector = connectors[peerId]
  if (!connector) {
    Logger.debug(TAG + '@acceptSession', 'missing connector')
    return
  }

  const account: string = yield call(getAccountAddress)
  const sessionData = {
    accounts: [account],
    chainId: parseInt(networkConfig.networkId),
  }
  connector.approveSession(sessionData)
  connector.updateSession(sessionData)
  yield put(storeSession(connector.session))
  yield put(showMessage(i18n.t('walletConnect:connectionSuccess', { dappName: peerMeta.name })))
  yield call(handlePendingStateOrNavigateBack)
}

export function* denySession({ session }: AcceptSession) {
  try {
    const { peerId } = session.params[0]
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }

    connector.rejectSession()
  } catch (e) {
    Logger.debug(TAG + '@denySession', e.message)
  }

  yield call(handlePendingStateOrNavigateBack)
}

// eslint-disable-next-line require-yield
export function* closeSession({ session }: CloseSession) {
  try {
    const { peerId } = session
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }

    connector
      .killSession()
      .catch((error) =>
        Logger.error(
          TAG + '@createWalletConnectChannelWithArgs',
          'Error trying to kill the session',
          error
        )
      )
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e)
  }
}

export function* acceptRequest(r: AcceptRequest) {
  const {
    peerId,
    request: { id, jsonrpc, method, params },
  } = r
  const connector = connectors[peerId]
  try {
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
  } catch (e) {
    Logger.debug(TAG + '@acceptRequest', e.message)
    connector?.rejectRequest({ id, jsonrpc, error: e.message })
  }

  yield call(handlePendingStateOrNavigateBack)
}

export function* denyRequest(r: DenyRequest) {
  const {
    peerId,
    request: { id },
  } = r
  try {
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }
    connector.rejectRequest({ id, error: { message: '' } })
  } catch (e) {
    Logger.debug(TAG + '@denyRequest', e?.message)
  }

  yield call(handlePendingStateOrNavigateBack)
}

export function* handleInitialiseWalletConnect({ uri }: InitialiseConnection) {
  const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
    createWalletConnectChannelWithArgs,
    { uri }
  )
  yield fork(listenForWalletConnectMessages, walletConnectChannel)
}

export function* listenForWalletConnectMessages(
  walletConnectChannel: EventChannel<WalletConnectActions>
) {
  while (true) {
    const message: WalletConnectActions = yield take(walletConnectChannel)
    yield put(message)
  }
}

// eslint-disable-next-line require-yield
export function* createWalletConnectChannelWithArgs(connectorOpts: any) {
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
      emit(payloadRequest(connector.peerId, payload))
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

/**
 * When handling incoming requests (actions or sessions) we need to handle
 * them in order. That means if a request comes in, and we already have a
 * pending one, ignore it. Once a request is dealt with we handle the new
 * requests accordingly.
 */

export function* handleSessionRequest({ session }: SessionRequest) {
  const { pending }: { pending: WalletConnectSessionRequest[] } = yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  navigate(Screens.WalletConnectSessionRequest, { version: 1, session })
}
export function* handlePayloadRequest(action: PayloadRequest) {
  const pendingActions: PendingAction[] = yield select(selectPendingActions)
  if (pendingActions.length > 1) {
    return
  }

  const metadata = getConnectorMetadata(action.peerId)
  if (!metadata) {
    throw new Error(`Unable to find metadata for peer ${action.peerId}`)
  }
  const { name: dappName, url: dappUrl, icons } = metadata

  navigate(Screens.WalletConnectActionRequest, {
    version: 1,
    peerId: action.peerId,
    action: action.request,
    dappName,
    dappUrl,
    dappIcon: icons[0],
  })
}

export function* handlePendingStateOrNavigateBack() {
  const hasPendingState: boolean = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield call(handlePendingState)
  } else {
    navigateHome()
  }
}

export function* handlePendingState(): any {
  const {
    pending: [session],
  }: {
    pending: WalletConnectSessionRequest[]
  } = yield select(selectSessions)

  if (session) {
    navigate(Screens.WalletConnectSessionRequest, { version: 1, session })
    return
  }

  const [action]: PendingAction[] = yield select(selectPendingActions)
  if (action) {
    const metadata = getConnectorMetadata(action.peerId)
    if (!metadata) {
      throw new Error(`Unable to find metadata for peer ${action.peerId}`)
    }
    const { name: dappName, url: dappUrl, icons } = metadata
    navigate(Screens.WalletConnectActionRequest, {
      version: 1,
      peerId: action.peerId,
      action: action.action,
      dappName,
      dappUrl,
      dappIcon: icons[0],
    })
  }
}

export function* checkPersistedState(): any {
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
  yield takeEvery(Actions.ACCEPT_REQUEST_V1, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST_V1, denyRequest)

  yield takeEvery(Actions.SESSION_V1, handleSessionRequest)
  yield takeEvery(Actions.PAYLOAD_V1, handlePayloadRequest)

  yield call(checkPersistedState)
}

export function* initialiseWalletConnectV1(uri: string, origin: WalletConnectPairingOrigin) {
  // if (!client) {
  //   yield put(initialiseClient())
  //   yield take(Actions.CLIENT_INITIALISED)
  // }
  yield put(initialiseConnection(uri))
}
