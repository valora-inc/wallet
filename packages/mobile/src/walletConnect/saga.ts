import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { call, select, spawn } from 'redux-saga/effects'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import Logger from 'src/utils/Logger'
import { initialiseWalletConnectV1, walletConnectV1Saga } from 'src/walletConnect/v1/saga'
import { initialiseWalletConnectV2, walletConnectV2Saga } from 'src/walletConnect/v2/saga'

export function* walletConnectSaga() {
  yield spawn(walletConnectV1Saga)
  yield spawn(walletConnectV2Saga)
}

export function* isWalletConnectEnabled(uri: string) {
  const { v1, v2 }: { v1: boolean; v2: boolean } = yield select(walletConnectEnabledSelector)
  const [, , version] = uri.split(/[:@?]/)
  const versionEnabled: { [version: string]: boolean | undefined } = {
    '1': v1,
    '2': v2,
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
    case '2':
      yield call(initialiseWalletConnectV2, uri, origin)
      break
    default:
      throw new Error(`Unsupported WalletConnect version '${version}'`)
  }
}
