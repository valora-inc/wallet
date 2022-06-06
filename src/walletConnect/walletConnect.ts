import { call, delay, fork, race, select, take } from 'redux-saga/effects'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ActiveDapp } from 'src/app/reducers'
import { activeDappSelector } from 'src/app/selectors'
import { getDappRequestOrigin } from 'src/app/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { selectHasPendingState } from 'src/walletConnect/selectors'
import { Actions } from 'src/walletConnect/v1/actions'

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

  // Show loading screen if there is no pending state
  // Sometimes the WC request is received from the WebSocket before this deeplink
  // handler is called, so it's important we don't display the loading screen on top
  const hasPendingState: boolean = yield select(selectHasPendingState)
  if (!hasPendingState) {
    yield fork(handleLoadingWithTimeout, { origin: WalletConnectPairingOrigin.Deeplink })
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

export function* handleLoadingWithTimeout(
  params: Partial<StackParamList[Screens.WalletConnectRequest]>
) {
  yield call(navigate, Screens.WalletConnectRequest, { ...params, loading: true })

  const { timedOut } = yield race({
    timedOut: delay(CONNECTION_TIMEOUT),
    sessionRequestRecieved: take(Actions.SESSION_V1),
    actionRequestRecieved: take(Actions.PAYLOAD_V1),
  })

  if (timedOut) {
    const activeDapp: ActiveDapp | null = yield select(activeDappSelector)
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, {
      dappRequestOrigin: getDappRequestOrigin(activeDapp),
      error: 'timed out while waiting for a session',
    })

    yield call(navigate, Screens.WalletConnectRequest, { loading: false, timedOut: true })
  }
}
