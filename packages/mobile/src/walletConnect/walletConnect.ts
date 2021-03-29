import { call } from 'redux-saga/effects'
import { initialiseWalletConnect } from 'src/walletConnect/saga'

export function* handleWalletConnectDeepLink(deepLink: string) {
  console.log('handleWalletConnectDeepLink', deepLink)

  const uri = deepLink.substring('celo://wallet/'.length)
  yield call(initialiseWalletConnect, uri)
}
