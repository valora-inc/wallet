import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { call, select, spawn } from 'redux-saga/effects'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import { initialiseWalletConnectV1, walletConnectV1Saga } from 'src/walletConnect/v1/saga'
import { initialiseWalletConnectV2, walletConnectV2Saga } from 'src/walletConnect/v2/saga'

export function* walletConnectSaga() {
  yield spawn(walletConnectV1Saga)
  yield spawn(walletConnectV2Saga)
}

export function* initialiseWalletConnect(uri: string, origin: WalletConnectPairingOrigin) {
  const walletConnectEnabled: boolean = yield select(walletConnectEnabledSelector)
  if (!walletConnectEnabled) {
    return
  }

  const [, , version] = uri.split(/[:@?]/)
  switch (version) {
    case '1':
      yield call(initialiseWalletConnectV1, uri, origin)
      break
    case '2':
      yield call(initialiseWalletConnectV2, uri, origin)
      break
    default:
      throw new Error(`Unsupported WalletConnect version '${version}''`)
  }
}
