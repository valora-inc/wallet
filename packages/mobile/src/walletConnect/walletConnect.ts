import { call, delay, race, select } from 'redux-saga/effects'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { activeScreenSelector } from 'src/app/selectors'
import i18n from 'src/i18n'
import { navigate, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { selectHasPendingState } from 'src/walletConnect/selectors'

const WC_PREFIX = 'wc:'
const DEEPLINK_PREFIX = 'celo://wallet/wc?uri='
const UNIVERSAL_LINK_PREFIX = 'https://valoraapp.com/wc?uri='
const UNIVERSAL_LINK_PREFIX_WITHOUT_URI = 'https://valoraapp.com/wc'
const CONNECTION_TIMEOUT = 10_000

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

  if (!link.includes('?')) {
    // action request, we can do nothing
    return
  }

  const hasPendingState: boolean = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield call(initialiseWalletConnect, link, WalletConnectPairingOrigin.Deeplink)
  } else {
    // Show loading screen if there is no pending state
    // Sometimes the WC request is received from the WebSocket before this deeplink
    // handler is called, so it's important we don't display the loading screen on top
    yield call(initialiseWalletConnectWithLoading, link, WalletConnectPairingOrigin.Deeplink)
  }
}

export function isWalletConnectDeepLink(deepLink: string) {
  return [WC_PREFIX, DEEPLINK_PREFIX, UNIVERSAL_LINK_PREFIX_WITHOUT_URI].some((prefix) =>
    decodeURIComponent(deepLink).startsWith(prefix)
  )
}

export function* initialiseWalletConnectWithLoading(
  uri: string,
  origin: WalletConnectPairingOrigin
) {
  yield call(navigate, Screens.WalletConnectLoading, { origin })

  const { timedOut } = yield race({
    timedOut: delay(CONNECTION_TIMEOUT),
    cancel: call(initialiseWalletConnect, uri, WalletConnectPairingOrigin.Deeplink),
  })

  if (timedOut) {
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, {
      error: 'timed out while waiting for a session',
    })

    yield call(handleWalletConnectNavigateAfterLoading, Screens.WalletConnectResult, {
      title: i18n.t('timeoutTitle'),
      subtitle: i18n.t('timeoutSubtitle'),
    })
  }
}

export function* handleWalletConnectNavigateAfterLoading(...args: Parameters<typeof navigate>) {
  // prevent wallet connect loading screen from remaining on the navigation
  // stack and being navigated back to
  const activeScreen = yield select(activeScreenSelector)
  if (activeScreen === Screens.WalletConnectLoading) {
    replace(...args)
  } else {
    navigate(...args)
  }
}
