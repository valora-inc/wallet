import { call, delay, fork, race, select, take } from 'redux-saga/effects'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Actions as AppActions, ActionTypes as AppActionTypes } from 'src/app/actions'
import { ActiveDapp } from 'src/app/reducers'
import { activeDappSelector, activeScreenSelector } from 'src/app/selectors'
import { getDappRequestOrigin } from 'src/app/utils'
import i18n from 'src/i18n'
import { navigate, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { selectHasPendingState } from 'src/walletConnect/selectors'

const WC_PREFIX = 'wc:'
const DEEPLINK_PREFIX = 'kolektivo://wallet/wc?uri='
const UNIVERSAL_LINK_PREFIX = 'https://kolektivo.app/wc?uri='
const UNIVERSAL_LINK_PREFIX_WITHOUT_URI = 'https://kolektivo.app/wc'
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

export function* handleLoadingWithTimeout(params: StackParamList[Screens.WalletConnectLoading]) {
  yield call(navigate, Screens.WalletConnectLoading, params)

  const { timedOut } = yield race({
    timedOut: delay(CONNECTION_TIMEOUT),
    appNavigation: take(
      (action: AppActionTypes) =>
        action.type === AppActions.ACTIVE_SCREEN_CHANGED &&
        action.activeScreen !== Screens.WalletConnectLoading
    ),
  })

  if (timedOut) {
    const activeDapp: ActiveDapp | null = yield select(activeDappSelector)
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, {
      dappRequestOrigin: getDappRequestOrigin(activeDapp),
      error: 'timed out while waiting for a session',
    })
    yield call(handleWalletConnectNavigate, Screens.WalletConnectResult, {
      title: i18n.t('timeoutTitle'),
      subtitle: i18n.t('timeoutSubtitle'),
    })
  }
}

export function* handleWalletConnectNavigate(...args: Parameters<typeof navigate>) {
  // prevent wallet connect loading screen from remaining on the navigation
  // stack and being navigated back to
  const activeScreen = yield select(activeScreenSelector)
  if (activeScreen === Screens.WalletConnectLoading) {
    replace(...args)
  } else {
    navigate(...args)
  }
}
