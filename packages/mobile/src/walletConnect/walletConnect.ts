import { call, select } from 'redux-saga/effects'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { selectHasPendingState } from 'src/walletConnect/selectors'

const WC_PREFIX = 'wc:'
const DEEPLINK_PREFIX = 'celo://wallet/wc?uri='
const UNIVERSAL_LINK_PREFIX = 'https://valoraapp.com/wc?uri='
const UNIVERSAL_LINK_PREFIX_WITHOUT_URI = 'https://valoraapp.com/wc'

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
  if (link.startsWith(DEEPLINK_PREFIX)) {
    link = deepLink.substring(DEEPLINK_PREFIX.length)
  }

  if (link.startsWith(UNIVERSAL_LINK_PREFIX)) {
    link = deepLink.substring(UNIVERSAL_LINK_PREFIX.length)
  }

  link = decodeURIComponent(link)

  // Show loading screen if there is no pending state
  // Sometimes the WC request is received from the WebSocket before this deeplink
  // handler is called, so it's important we don't display the loading screen on top
  const hasPendingState: boolean = yield select(selectHasPendingState)
  if (!hasPendingState) {
    navigate(Screens.WalletConnectLoading, { origin: WalletConnectPairingOrigin.Deeplink })
  }

  // connection request
  if (link.includes('?')) {
    yield call(initialiseWalletConnect, link, WalletConnectPairingOrigin.Deeplink)
  }

  // action request, we can do nothing
}

export function isWalletConnectDeepLink(deepLink: string) {
  return [WC_PREFIX, DEEPLINK_PREFIX, UNIVERSAL_LINK_PREFIX_WITHOUT_URI].some((prefix) =>
    decodeURIComponent(deepLink).startsWith(prefix)
  )
}
