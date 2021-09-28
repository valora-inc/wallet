import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { call, put, select, spawn } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import { navigateBack } from 'src/navigator/NavigationService'
import { initialiseWalletConnectV1, walletConnectV1Saga } from 'src/walletConnect/v1/saga'

export function* walletConnectSaga() {
  yield spawn(walletConnectV1Saga)
  // TODO: Add back once it's working
  // yield spawn(walletConnectV2Saga)
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
      yield put(showError(ErrorMessages.WC2_UNSUPPORTED))
      navigateBack()
      // TODO: Add back once it's working
      // yield call(initialiseWalletConnectV2, uri, origin)
      break
    default:
      throw new Error(`Unsupported WalletConnect version '${version}'`)
  }
}
