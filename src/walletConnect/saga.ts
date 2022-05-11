import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { call, put, select, spawn } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { activeDappSelector, walletConnectEnabledSelector } from 'src/app/selectors'
import i18n from 'src/i18n'
import Logger from 'src/utils/Logger'
import { initialiseWalletConnectV1, walletConnectV1Saga } from 'src/walletConnect/v1/saga'

export function* walletConnectSaga() {
  yield spawn(walletConnectV1Saga)
}

export function* isWalletConnectEnabled(uri: string) {
  const { v1 }: { v1: boolean } = yield select(walletConnectEnabledSelector)
  const [, , version] = uri.split(/[:@?]/)
  const versionEnabled: { [version: string]: boolean | undefined } = {
    '1': v1,
  }
  return versionEnabled[version] ?? false
}

export function* initialiseWalletConnect(uri: string, origin: WalletConnectPairingOrigin) {
  const walletConnectEnabled: boolean = yield call(isWalletConnectEnabled, uri)

  const [, , version] = uri.split(/[:@?]/)
  if (!walletConnectEnabled) {
    Logger.debug('initialiseWalletConnect', `v${version} is disabled, ignoring`)
    return
  }

  switch (version) {
    case '1':
      yield call(initialiseWalletConnectV1, uri, origin)
      break
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
