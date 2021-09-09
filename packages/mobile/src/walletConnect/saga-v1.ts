import { appendPath } from '@celo/base'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient from '@walletconnect/client-v1'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
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
  payloadRequest,
  sessionRequest,
  WalletConnectActions,
} from 'src/walletConnect/actions-v1'
import { PendingSession, Session } from 'src/walletConnect/reducer'
import { handleRequest } from 'src/walletConnect/request'
import { handlePendingState, handlePendingStateOrNavigateBack } from 'src/walletConnect/saga'
import { selectPendingActions, selectSessions } from 'src/walletConnect/selectors'
import { WalletConnectSessionRequest } from 'src/walletConnect/types'
import { getAccountAddress } from 'src/web3/saga'

console.log('>>>', require('@walletconnect/browser-utils').getClientMeta)

const connectors: { [x: string]: WalletConnectClient | undefined } = {}

const TAG = 'WalletConnect/saga-v1'

export function getConnectorMetadata(peerId: string) {
  if (!connectors[peerId]) {
    return null
  }
  return connectors[peerId]!.clientMeta
}

export function* acceptSession(session: AcceptSession) {
  const { peerId } = session.session.params[0]
  const connector = connectors[peerId]
  if (!connector) {
    Logger.debug(TAG + '@acceptRequest', 'missing connector')
    return
  }

  const account: string = yield call(getAccountAddress)
  connector.approveSession({
    accounts: [account],
    chainId: parseInt(networkConfig.networkId),
  })
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

export function* closeSession({ session }: CloseSession) {
  try {
    const { peerId } = session.payload.params[0]
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }

    connector.killSession()
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e.message)
  }
}

export function* acceptRequest(r: AcceptRequest): any {
  const {
    peerId,
    request: { id, method, params },
  } = r
  try {
    const connector = connectors[peerId]
    if (!connector) {
      throw new Error('missing connector')
    }
    const result = yield call(handleRequest, { method, params })
    connector.approveRequest({ id: result })
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e.message)
    connectors[peerId]?.rejectRequest({ id, error: e.message })
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
    connector.rejectRequest({ id, error: '' })
  } catch (e) {
    Logger.debug(TAG + '@denyRequest', e.message)
  }

  yield call(handlePendingStateOrNavigateBack)
}

export function* handleInitialiseWalletConnect({ uri }: InitialiseConnection) {
  const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
    createWalletConnectChannel,
    uri
  )
  while (true) {
    const message: WalletConnectActions = yield take(walletConnectChannel)
    yield put(message)
  }
}

export function* createWalletConnectChannelWithArgs(connectorOpts: any) {
  return eventChannel((emit: any) => {
    console.log('>>> 1', {
      ...connectorOpts,
      clientMeta: {
        name: APP_NAME,
        description: i18n.t('global:appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
    })
    const connector = new WalletConnectClient({
      ...connectorOpts,
      clientMeta: {
        name: APP_NAME,
        description: i18n.t('global:appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
    })
    console.log('>>> 2', connector)
    connector!.on('session_request', (error: any, payload: WalletConnectSessionRequest) => {
      console.log('session_request', error, payload)
      connectors[payload.params[0].peerId] = connector
      emit(sessionRequest(payload))
    })
    connector!.on('call_request', (error: any, payload: any) => {
      console.log('call_request', error, payload)
      emit(payloadRequest(connector.peerId, payload))
    })
    return () => {
      connector!.off('session_request')
      connector!.off('call_request')
      connector!.killSession()
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

export function* handleSessionRequest(session: any) {
  console.log('handleSessionRequest', session)
  navigate(Screens.WalletConnectSessionRequest, { isV1: true, session })
}
export function* handlePayloadRequest(payload: any) {
  console.log('handlePayloadRequest', payload)
  const { v1, v2 } = yield select(selectPendingActions)
  if (v1.length > 1 || v2.length > 1) {
    return
  }

  navigate(Screens.WalletConnectActionRequest, { isV1: true, action: payload })
}

function* loadWalletConnectState() {
  const {
    sessions,
  }: {
    pending: PendingSession[]
    sessions: Session[]
  } = yield select(selectSessions)

  sessions
    .filter((s) => s.isV1)
    .map((s) => {
      const connector = connectors[s.session.peerId]
      // @ts-ignore
      const connectorConnected = connector?._transport.connected
      if (!connectorConnected) {
        // @ts-ignore
        if (connector?._eventManager) {
          // @ts-ignore
          connector._eventManager = null
        }
        createWalletConnectChannelWithArgs({ session: s.session })
      }
    })
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

  yield call(loadWalletConnectState)
}
