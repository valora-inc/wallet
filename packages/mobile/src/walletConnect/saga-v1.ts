import { appendPath } from '@celo/utils/lib/string'
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
  Actions,
  CloseSession,
  InitialiseConnection,
  payloadRequest,
  sessionRequest,
  WalletConnectActions,
} from 'src/walletConnect/actions-v1'
import { handleRequest } from 'src/walletConnect/request'
import { handlePendingState, handlePendingStateOrNavigateBack } from 'src/walletConnect/saga'
import { selectPendingActions } from 'src/walletConnect/selectors'
import { getAccountAddress } from 'src/web3/saga'

let connector: WalletConnectClient | null = null

const TAG = 'WalletConnect/saga-v1'

export function* acceptSession() {
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

export function* denySession() {
  try {
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
    if (!connector) {
      throw new Error('missing connector')
    }
    connector.killSession()
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e.message)
  }
}

export function* acceptRequest({ id, jsonrpc, method, params }: any): any {
  if (!connector) {
    Logger.debug(TAG + '@acceptRequest', 'missing connector')
    return
  }

  try {
    const result = yield call(handleRequest, { method, params })
    connector.approveRequest({ id: result })
  } catch (e) {
    connector.rejectRequest({ id, error: e.message })
  }

  yield call(handlePendingStateOrNavigateBack)
}

export function* denyRequest({ id }: any) {
  if (!connector) {
    Logger.debug(TAG + '@acceptRequest', 'missing connector')
    return
  }

  // @ts-ignore
  connector.rejectRequest({ id, error: '' })
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

export function* createWalletConnectChannel(uri: string) {
  connector = new WalletConnectClient({
    uri,
    clientMeta: {
      name: APP_NAME,
      description: i18n.t('global:appDescription'),
      url: WEB_LINK,
      icons: [appendPath(WEB_LINK, '/favicon.ico')],
    },
  })

  return eventChannel((emit: any) => {
    connector!.on('session_request', (error: any, payload: any) => emit(sessionRequest(payload)))
    connector!.on('call_request', (error: any, payload: any) => emit(payloadRequest(payload)))

    return () => {
      connector!.off('session_request')
      connector!.off('call_request')
      connector!.killSession()
      connector = null
    }
  })
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

export function* walletConnectV1Saga() {
  yield takeLeading(Actions.INITIALISE_CONNECTION_V1, handleInitialiseWalletConnect)

  yield takeEvery(Actions.ACCEPT_SESSION_V1, acceptSession)
  yield takeEvery(Actions.DENY_SESSION_V1, denySession)
  yield takeEvery(Actions.CLOSE_SESSION_V1, closeSession)
  yield takeEvery(Actions.ACCEPT_REQUEST_V1, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST_V1, denyRequest)

  yield takeEvery(Actions.SESSION_V1, handleSessionRequest)
  yield takeEvery(Actions.PAYLOAD_V1, handlePayloadRequest)
}
