import { call } from 'redux-saga/effects'
import { initialiseWalletConnect } from 'src/walletConnect/saga'

export function* handleWalletConnectDeepLink(deepLink: string) {
  const uri = deepLink.substring('celo://wallet/'.length)
  yield call(initialiseWalletConnect, uri)
}
