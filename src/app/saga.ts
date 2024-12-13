import locales from 'locales'
import { AppState, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import InAppReview from 'react-native-in-app-review'
import * as Keychain from 'react-native-keychain'
import { findBestLanguageTag } from 'react-native-localize'
import { eventChannel } from 'redux-saga'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AppEvents, InviteEvents } from 'src/analytics/Events'
import { HooksEnablePreviewOrigin } from 'src/analytics/types'
import {
  Actions,
  OpenDeepLink,
  OpenUrlAction,
  SetAppState,
  androidMobileServicesAvailabilityChecked,
  appLock,
  inAppReviewRequested,
  inviteLinkConsumed,
  openDeepLink,
  setAppState,
  setSupportedBiometryType,
  updateRemoteConfigValues,
} from 'src/app/actions'
import {
  getLastTimeBackgrounded,
  getRequirePinOnAppOpen,
  googleMobileServicesAvailableSelector,
  huaweiMobileServicesAvailableSelector,
  inAppReviewLastInteractionTimestampSelector,
  sentryNetworkErrorsSelector,
} from 'src/app/selectors'
import { CeloNewsConfig } from 'src/celoNews/types'
import { DEFAULT_APP_LANGUAGE, FETCH_TIMEOUT_DURATION, isE2EEnv } from 'src/config'
import { FiatExchangeFlow } from 'src/fiatExchanges/types'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'
import { fetchRemoteConfigValues } from 'src/firebase/firebase'
import { initI18n } from 'src/i18n'
import {
  allowOtaTranslationsSelector,
  currentLanguageSelector,
  otaTranslationsAppVersionSelector,
} from 'src/i18n/selectors'
import { jumpstartClaim } from 'src/jumpstart/saga'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { handleEnableHooksPreviewDeepLink } from 'src/positions/saga'
import { allowHooksPreviewSelector } from 'src/positions/selectors'
import { Actions as SendActions } from 'src/send/actions'
import { handlePaymentDeeplink } from 'src/send/utils'
import { initializeSentry } from 'src/sentry/Sentry'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getFeatureGate, patchUpdateStatsigUser, setupOverridesFromLaunchArgs } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { swapSuccess } from 'src/swap/slice'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { isDeepLink, navigateToURI } from 'src/utils/linking'
import { safely } from 'src/utils/safely'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { isWalletConnectEnabled } from 'src/walletConnect/saga'
import {
  handleWalletConnectDeepLink,
  isWalletConnectDeepLink,
} from 'src/walletConnect/walletConnect'
import { walletAddressSelector } from 'src/web3/selectors'
import {
  all,
  call,
  cancelled,
  delay,
  put,
  race,
  select,
  spawn,
  take,
  takeEvery,
  takeLatest,
} from 'typed-redux-saga'
import { parse } from 'url'
import { Address, Hex } from 'viem'

const TAG = 'app/saga'

// There are cases, when user will put the app into `background` state,
// but we do not want to lock it immeditely. Here are some examples:
// case 1: User switches to SMS app to copy verification text
// case 2: User gets a permission request dialog
//    (which will put an app into `background` state until dialog disappears).
const DO_NOT_LOCK_PERIOD = 30000 // 30 sec

// REVIEW_INTERVAL is the time between app review prompts
const REVIEW_INTERVAL = ONE_DAY_IN_MILLIS * 120 // 120 days

// Work that's done before other sagas are initalized
// Be mindful to not put long blocking tasks here
export function* appInit() {
  SentryTransactionHub.startTransaction(SentryTransaction.app_init_saga)

  const allowOtaTranslations = yield* select(allowOtaTranslationsSelector)
  const otaTranslationsAppVersion = yield* select(otaTranslationsAppVersionSelector)
  const language = yield* select(currentLanguageSelector)
  const bestLanguage = findBestLanguageTag(Object.keys(locales))?.languageTag

  yield* all([
    call(initializeSentry),
    call([AppAnalytics, 'init']),
    call(
      initI18n,
      language || bestLanguage || DEFAULT_APP_LANGUAGE,
      allowOtaTranslations,
      otaTranslationsAppVersion
    ),
  ])

  // This step is important if the user is offline and unable to fetch remote
  // config values, we can use the persisted value instead of an empty one
  const sentryNetworkErrors = yield* select(sentryNetworkErrorsSelector)
  Logger.setNetworkErrors(sentryNetworkErrors)

  const supportedBiometryType = yield* call(Keychain.getSupportedBiometryType)
  yield* put(setSupportedBiometryType(supportedBiometryType))

  // setup statsig overrides for E2E tests
  if (isE2EEnv) {
    setupOverridesFromLaunchArgs()
  }

  SentryTransactionHub.finishTransaction(SentryTransaction.app_init_saga)
}

// Check the availability of Google Mobile Services and Huawei Mobile Services, an alternative to
// that ships with Huawei phones which do not have GMS. Log and report the result to analytics.
// Note: On iOS, this will be a no-op.
export function* checkAndroidMobileServicesSaga() {
  if (Platform.OS !== 'android') {
    return
  }

  // Check to see if Google Mobile Services (i.e. Google Play Services) are available on this device.
  let googleIsAvailable: boolean | undefined
  try {
    googleIsAvailable = yield* call([DeviceInfo, DeviceInfo.hasGms])
    Logger.info(TAG, 'Result of check for Google Mobile Services', googleIsAvailable)
  } catch (e) {
    Logger.error(TAG, 'Error in check for Google Mobile Services', e)
  }

  // Check to see if Huawei Mobile Services are available on this device.
  let huaweiIsAvailable: boolean | undefined
  try {
    huaweiIsAvailable = yield* call([DeviceInfo, DeviceInfo.hasHms])
    Logger.info(TAG, `Result of check for Huawei Mobile Services`, huaweiIsAvailable)
  } catch (e) {
    Logger.error(TAG, `Error in check for Huawei Mobile Services`, e)
  }

  // Check if the availability status has changed. If so, log an analytics events.
  // When this is first run, the status in the state tree will be undefined, ensuring this event is
  // fired at least once for each client.
  const updated =
    googleIsAvailable !== (yield* select(googleMobileServicesAvailableSelector)) ||
    huaweiIsAvailable !== (yield* select(huaweiMobileServicesAvailableSelector))

  if (updated) {
    AppAnalytics.track(AppEvents.android_mobile_services_checked, {
      googleIsAvailable,
      huaweiIsAvailable,
    })
  }

  yield* put(androidMobileServicesAvailabilityChecked(googleIsAvailable, huaweiIsAvailable))
}

export interface RemoteConfigValues {
  celoEducationUri: string | null
  dappListApiUrl: string | null
  inviteRewardsVersion: string
  walletConnectV2Enabled: boolean
  logPhoneNumberTypeEnabled: boolean
  pincodeUseExpandedBlocklist: boolean
  allowOtaTranslations: boolean
  sentryTracesSampleRate: number
  sentryNetworkErrors: string[]
  maxNumRecentDapps: number
  dappsWebViewEnabled: boolean
  fiatConnectCashInEnabled: boolean
  fiatConnectCashOutEnabled: boolean
  fiatAccountSchemaCountryOverrides: FiatAccountSchemaCountryOverrides
  coinbasePayEnabled: boolean
  showSwapMenuInDrawerMenu: boolean
  maxSwapSlippagePercentage: number
  networkTimeoutSeconds: number
  celoNews: CeloNewsConfig
  priceImpactWarningThreshold: number
}

export function* appRemoteFeatureFlagSaga() {
  // Refresh feature flags on process start
  // and every hour afterwards when the app becomes active.
  // If the app keep getting killed and restarted we
  // will load the flags more often, but that should be pretty rare.
  // if that ever becomes a problem we can save it somewhere persistent.
  let lastLoadTime = 0
  let isAppActive = true

  while (true) {
    const isRefreshTime = Date.now() - lastLoadTime > 60 * 60 * 1000

    if (isAppActive && isRefreshTime) {
      const { configValues } = yield* race({
        configValues: call(fetchRemoteConfigValues),
        timeout: delay(FETCH_TIMEOUT_DURATION),
      })
      if (configValues) {
        Logger.setNetworkErrors(configValues.sentryNetworkErrors)
        yield* put(updateRemoteConfigValues(configValues))
        lastLoadTime = Date.now()
      }
    }

    const action = (yield* take(Actions.SET_APP_STATE)) as SetAppState
    isAppActive = action.state === 'active'
  }
}

function parseValue(value: string) {
  if (['true', 'false'].indexOf(value) >= 0) {
    return value === 'true'
  }
  const number = parseFloat(value)
  if (!isNaN(number)) {
    return number
  }
  return value
}

// Parses the query string into an object. Only works with built-in strings, booleans and numbers.
function convertQueryToScreenParams(query: string) {
  const decodedParams = new URLSearchParams(decodeURIComponent(query))
  const params: { [key: string]: any } = {}
  decodedParams.forEach((value, key) => {
    params[key] = parseValue(value)
  })
  return params
}

export function* handleDeepLink(action: OpenDeepLink) {
  const { deepLink } = action
  const { isSecureOrigin } = action
  Logger.debug(TAG, `Handling deep link: ${deepLink}, isSecureOrigin: ${isSecureOrigin}`)

  const walletAddress = yield* select(walletAddressSelector)
  if (!walletAddress) {
    Logger.error(TAG, 'No wallet address found in store. This should never happen.')
    return
  }

  if (isWalletConnectDeepLink(deepLink)) {
    yield* call(handleWalletConnectDeepLink, deepLink)
    return
  }

  const rawParams = parse(deepLink)
  if (rawParams.path) {
    const pathParts = rawParams.path.split('/')
    const pathStartsWith = pathParts[1].split('?')[0]
    // Only log detailed paramters (fullPath and query) for allowed paths. This is a security precaution so we
    // don't accidentally log sensitive information on new deeplinks. 'jumpstart' is specifically excluded
    const pathStartsWithAllowList = [
      'pay',
      'cashIn',
      'bidali',
      'cash-in-success',
      'cash-in-failure',
      'openScreen',
      'share',
      'hooks',
    ]
    AppAnalytics.track(AppEvents.handle_deeplink, {
      pathStartsWith: pathParts[1].split('?')[0],
      fullPath: pathStartsWithAllowList.includes(pathStartsWith) ? rawParams.pathname : null,
      query: pathStartsWithAllowList.includes(pathStartsWith) ? rawParams.query : null,
    })
    if (rawParams.path.startsWith('/pay')) {
      yield* call(handlePaymentDeeplink, deepLink)
    } else if (rawParams.path === '/cashIn') {
      navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
    } else if (rawParams.pathname === '/bidali') {
      navigate(Screens.BidaliScreen, { currency: undefined })
    } else if (rawParams.path.startsWith('/cash-in-success')) {
      // Some providers append transaction information to the redirect links so can't check for strict equality
      const cicoSuccessParam = (rawParams.pathname?.match(/cash-in-success\/(.+)/) || [])[1]
      navigate(Screens.CashInSuccess, { provider: cicoSuccessParam.split('/')[0] })
      // Some providers append transaction information to the redirect links so can't check for strict equality
    } else if (rawParams.path.startsWith('/cash-in-failure')) {
      navigateHome()
    } else if (isSecureOrigin && rawParams.pathname === '/openScreen' && rawParams.query) {
      // The isSecureOrigin is important. We don't want it to be possible to fire this deep link from outside
      // of our own notifications for security reasons.
      const params = convertQueryToScreenParams(rawParams.query)
      navigate(params.screen as keyof StackParamList, params)
    } else if (pathParts.length === 3 && pathParts[1] === 'share') {
      const inviterAddress = pathParts[2]
      yield* put(inviteLinkConsumed(inviterAddress))
      AppAnalytics.track(InviteEvents.opened_via_invite_url, {
        inviterAddress,
      })
    } else if (pathParts.length === 4 && pathParts[1] === 'jumpstart') {
      const privateKey = pathParts[2] as Hex
      const networkId = pathParts[3] as NetworkId
      yield* call(jumpstartClaim, privateKey, networkId, walletAddress as Address)
    } else if (
      (yield* select(allowHooksPreviewSelector)) &&
      rawParams.pathname === '/hooks/enablePreview'
    ) {
      yield* call(handleEnableHooksPreviewDeepLink, deepLink, HooksEnablePreviewOrigin.Deeplink)
    }
  }
}

function* watchDeepLinks() {
  // using takeEvery over takeLatest because openScreen deep links could be
  // fired by multiple handlers (one with isSecureOrigin and one without), and
  // if takeLatest kills the call to the handler with isSecureOrigin, the deep
  // link won't work.
  yield* takeEvery(Actions.OPEN_DEEP_LINK, safely(handleDeepLink))
}

export function* handleOpenUrl(action: OpenUrlAction) {
  const { url, openExternal, isSecureOrigin } = action
  const walletConnectEnabled: boolean = yield* call(isWalletConnectEnabled, url)
  Logger.debug(TAG, 'Handling url', url)
  if (isDeepLink(url) || (walletConnectEnabled && isWalletConnectDeepLink(url))) {
    // Handle celo links directly, this avoids showing the "Open with App" sheet on Android
    yield* call(handleDeepLink, openDeepLink(url, isSecureOrigin))
  } else if (/^https?:\/\//i.test(url) === true && !openExternal) {
    // We display http or https links using our in app browser, unless openExternal is forced
    navigate(Screens.WebViewScreen, { uri: url })
  } else {
    // Fallback
    yield* call(navigateToURI, url)
  }
}

function* watchOpenUrl() {
  yield* takeEvery(Actions.OPEN_URL, safely(handleOpenUrl))
}

function createAppStateChannel() {
  return eventChannel((emit: any) => {
    const appStateListener = AppState.addEventListener('change', emit)

    return () => {
      appStateListener.remove()
    }
  })
}

function* watchAppState() {
  Logger.debug(`${TAG}@monitorAppState`, 'Starting monitor app state saga')
  const appStateChannel = yield* call(createAppStateChannel)
  while (true) {
    try {
      const newState = (yield* take(appStateChannel)) as string
      Logger.debug(`${TAG}@monitorAppState`, `App changed state: ${newState}`)
      yield* put(setAppState(newState))
    } catch (err) {
      const error = ensureError(err)
      AppAnalytics.track(AppEvents.app_state_error, { error: error.message })
      Logger.error(`${TAG}@monitorAppState`, `App state Error`, error)
    } finally {
      if (yield* cancelled()) {
        appStateChannel.close()
      }
    }
  }
}

export function* handleSetAppState(action: SetAppState) {
  const requirePinOnAppOpen = yield* select(getRequirePinOnAppOpen)
  const lastTimeBackgrounded = yield* select(getLastTimeBackgrounded)
  const isPassedDoNotLockPeriod = Date.now() - lastTimeBackgrounded > DO_NOT_LOCK_PERIOD
  const isAppActive = action.state === 'active'

  if (requirePinOnAppOpen && isPassedDoNotLockPeriod && isAppActive) {
    yield* put(appLock())
  }

  if (isAppActive) {
    // Force a statsig refresh by updating the user object
    yield* call(patchUpdateStatsigUser)
  }
}

export function* requestInAppReview() {
  const walletAddress = yield* select(walletAddressSelector)
  // Quick return if no wallet address or the device does not support in app review
  if (
    !walletAddress ||
    !InAppReview.isAvailable() ||
    !getFeatureGate(StatsigFeatureGates.APP_REVIEW)
  )
    return

  const lastInteractionTimestamp = yield* select(inAppReviewLastInteractionTimestampSelector)
  const now = Date.now()

  // If the last interaction was less than a quarter year ago or null
  if (!lastInteractionTimestamp || now - lastInteractionTimestamp >= REVIEW_INTERVAL) {
    try {
      // If we call InAppReview.RequestInAppReview and there wasn't an error
      // Update the last interaction timestamp and send analytics
      yield* call(InAppReview.RequestInAppReview)
      yield* put(inAppReviewRequested(now))
      AppAnalytics.track(AppEvents.in_app_review_impression)
    } catch (err) {
      const error = ensureError(err)
      Logger.error(TAG, `Error while calling InAppReview.RequestInAppReview`, error)
      AppAnalytics.track(AppEvents.in_app_review_error, { error: error.message })
    }
  }
}

function* watchAppReview() {
  // Triggers on successful payment, swap, or rewards claim
  yield* takeLatest([SendActions.SEND_PAYMENT_SUCCESS, swapSuccess], safely(requestInAppReview))
}

export function* appSaga() {
  yield* spawn(watchDeepLinks)
  yield* spawn(watchOpenUrl)
  yield* spawn(watchAppState)
  yield* takeLatest(Actions.SET_APP_STATE, safely(handleSetAppState))
  yield* spawn(watchAppReview)
}
