import { call } from 'redux-saga/effects'
import { initialiseWalletConnect } from 'src/walletConnect/saga'

const wcPrefix = 'wc:'
const deepLinkPrefix = 'celo://wallet/wc?uri='
const universalLinkPrefix = 'https://valoraapp.com/wc?uri='

/**
 * See https://docs.walletconnect.org/v/2.0/mobile-linking for exactly
 * how these links can look.
 *
 * Once we have a link (whether deep or universal) we need to figure out
 * if it's a connection request (in which case we need to initialise the
 * connection) or an action request (in which case it's a no op and the
 * already establised WC client will handle showing the prompt)
 */
export function* handleWalletConnectDeepLink(deepLink: string) {
  let link = deepLink
  if (link.startsWith(deepLinkPrefix)) {
    link = deepLink.substring(deepLinkPrefix.length)
  }

  if (link.startsWith(universalLinkPrefix)) {
    link = deepLink.substring(universalLinkPrefix.length)
  }

  // connection request
  if (link.includes('?')) {
    yield call(initialiseWalletConnect, link)
  }

  // action request, we can do nothing
}

export function isWalletConnectDeepLink(deepLink: string) {
  return [wcPrefix, deepLinkPrefix, universalLinkPrefix].some((prefix) =>
    deepLink.startsWith(prefix)
  )
}
