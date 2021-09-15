import { appendPath } from '@celo/base'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient from '@walletconnect/client-v1'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, fork, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  CloseSession,
  DenyRequest,
  InitialiseConnection,
  PayloadRequest,
  payloadRequest,
  sessionDeleted,
  SessionRequest,
  sessionRequest,
  storeSession,
  WalletConnectActions,
} from 'src/walletConnect/actions-v1'
import { PendingAction, PendingSession, Session } from 'src/walletConnect/reducer'
import { handleRequest } from 'src/walletConnect/request'
import { handlePendingState, handlePendingStateOrNavigateBack } from 'src/walletConnect/saga'
import { selectPendingActions, selectSessions } from 'src/walletConnect/selectors'
import { WalletConnectPayloadRequest, WalletConnectSessionRequest } from 'src/walletConnect/types'
import { getAccountAddress } from 'src/web3/saga'

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
  const { peerId } = session.session.params[0]
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
  yield call(handlePendingState)
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

  yield call(handlePendingState)
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
  try {
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }
    const result: string = yield call(handleRequest, { method, params })
    connector.approveRequest({ id, jsonrpc, result })
  } catch (e) {
    Logger.debug(TAG + '@acceptRequest', e.message)
    connectors[peerId]?.rejectRequest({ id, jsonrpc, error: e.message })
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
    createWalletConnectChannel,
    uri
  )
  yield call(listenForWalletConnectMessages, walletConnectChannel)
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
      connectors[payload.params[0].peerId] = connector
      payload.uri = connectorOpts.uri
      emit(sessionRequest(payload))
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

export function createWalletConnectChannel(uri: string) {
  return createWalletConnectChannelWithArgs({ uri })
}

/**
 * When handling incoming requests (actions or sessions) we need to handle
 * them in order. That means if a request comes in, and we already have a
 * pending one, ignore it. Once a request is dealt with we handle the new
 * requests accordingly.
 */

export function* handleSessionRequest({ session }: SessionRequest) {
  const { pending }: { pending: PendingSession[] } = yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  navigate(Screens.WalletConnectSessionRequest, { isV1: true, session })
}
export function* handlePayloadRequest(action: PayloadRequest) {
  const pendingActions: PendingAction[] = yield select(selectPendingActions)
  if (pendingActions.length > 1) {
    return
  }

  navigate(Screens.WalletConnectActionRequest, {
    isV1: true,
    peerId: action.peerId,
    action: action.request,
  })
}

export function* checkPersistedState(): any {
  const { sessions }: { sessions: Session[] } = yield select(selectSessions)

  for (const session of sessions) {
    if (!session.isV1) {
      return
    }
    try {
      const connector = connectors[session.session.peerId]
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
          { session: session.session }
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
  yield takeLeading(Actions.INITIALISE_CONNECTION_V1, handleInitialiseWalletConnect)

  yield takeEvery(Actions.ACCEPT_SESSION_V1, acceptSession)
  yield takeEvery(Actions.DENY_SESSION_V1, denySession)
  yield takeEvery(Actions.CLOSE_SESSION_V1, closeSession)
  yield takeEvery(Actions.ACCEPT_REQUEST_V1, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST_V1, denyRequest)

  yield takeEvery(Actions.SESSION_V1, handleSessionRequest)
  yield takeEvery(Actions.PAYLOAD_V1, handlePayloadRequest)

  yield call(checkPersistedState)
}
