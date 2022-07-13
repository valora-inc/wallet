import URLSearchParamsReal from '@ungap/url-search-params'
import { AppState, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import * as Keychain from 'react-native-keychain'
import { eventChannel } from 'redux-saga'
import {
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
} from 'redux-saga/effects'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  Actions,
  androidMobileServicesAvailabilityChecked,
  appLock,
  DappSelected,
  minAppVersionDetermined,
  OpenDeepLink,
  openDeepLink,
  openUrl,
  OpenUrlAction,
  SetAppState,
  setAppState,
  setSupportedBiometryType,
  updateRemoteConfigValues,
} from 'src/app/actions'
import {
  dappsWebViewEnabledSelector,
  getLastTimeBackgrounded,
  getRequirePinOnAppOpen,
  googleMobileServicesAvailableSelector,
  huaweiMobileServicesAvailableSelector,
  sentryNetworkErrorsSelector,
} from 'src/app/selectors'
import { SuperchargeButtonType } from 'src/app/types'
import { runVerificationMigration } from 'src/app/verificationMigration'
import { FETCH_TIMEOUT_DURATION } from 'src/config'
import { SuperchargeTokenConfig } from 'src/consumerIncentives/types'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { appVersionDeprecationChannel, fetchRemoteConfigValues } from 'src/firebase/firebase'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { PaymentDeepLinkHandler } from 'src/merchantPayment/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { paymentDeepLinkHandlerMerchant } from 'src/qrcode/utils'
import { handlePaymentDeeplink } from 'src/send/utils'
import { initializeSentry } from 'src/sentry/Sentry'
import { isDeepLink, navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { clockInSync } from 'src/utils/time'
import { isWalletConnectEnabled } from 'src/walletConnect/saga'
import {
  handleWalletConnectDeepLink,
  isWalletConnectDeepLink,
} from 'src/walletConnect/walletConnect'
import { parse } from 'url'

const TAG = 'app/saga'

// There are cases, when user will put the app into `background` state,
// but we do not want to lock it immeditely. Here are some examples:
// case 1: User switches to SMS app to copy verification text
// case 2: User gets a permission request dialog
//    (which will put an app into `background` state until dialog disappears).
const DO_NOT_LOCK_PERIOD = 30000 // 30 sec

// Work that's done before other sagas are initalized
// Be mindful to not put long blocking tasks here
export function* appInit() {
  yield call(initializeSentry)
  // This step is important if the user if offline and unable to fetch remote
  // config values, we can use the persisted value instead of an empty one
  const sentryNetworkErrors = yield select(sentryNetworkErrorsSelector)
  Logger.setNetworkErrors(sentryNetworkErrors)

  const supportedBiometryType = yield call(Keychain.getSupportedBiometryType)
  yield put(setSupportedBiometryType(supportedBiometryType))

  const inSync = yield call(clockInSync)
  if (!inSync) {
    navigate(Screens.SetClock)
    return
  }
}

export function* appVersionSaga() {
  const appVersionChannel = yield call(appVersionDeprecationChannel)
  if (!appVersionChannel) {
    return
  }
  try {
    while (true) {
      const minRequiredVersion = yield take(appVersionChannel)
      Logger.info(TAG, `Required min version: ${minRequiredVersion}`)
      // Note: The NavigatorWrapper will read this value from the store and
      // show the UpdateScreen if necessary.
      yield put(minAppVersionDetermined(minRequiredVersion))
    }
  } catch (error) {
    Logger.error(`${TAG}@appVersionSaga`, 'Failed to watch app version', error)
  } finally {
    if (yield cancelled()) {
      appVersionChannel.close()
    }
  }
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
    googleIsAvailable = yield call([DeviceInfo, DeviceInfo.hasGms])
    Logger.info(TAG, 'Result of check for Google Mobile Services', googleIsAvailable)
  } catch (e) {
    Logger.error(TAG, 'Error in check for Google Mobile Services', e)
  }

  // Check to see if Huawei Mobile Services are available on this device.
  let huaweiIsAvailable: boolean | undefined
  try {
    huaweiIsAvailable = yield call([DeviceInfo, DeviceInfo.hasHms])
    Logger.info(TAG, `Result of check for Huawei Mobile Services`, huaweiIsAvailable)
  } catch (e) {
    Logger.error(TAG, `Error in check for Huawei Mobile Services`, e)
  }

  // Check if the availability status has changed. If so, log an analytics events.
  // When this is first run, the status in the state tree will be undefined, ensuring this event is
  // fired at least once for each client.
  const updated =
    googleIsAvailable !== (yield select(googleMobileServicesAvailableSelector)) ||
    huaweiIsAvailable !== (yield select(huaweiMobileServicesAvailableSelector))

  if (updated) {
    ValoraAnalytics.track(AppEvents.android_mobile_services_availability_checked, {
      googleIsAvailable,
      huaweiIsAvailable,
    })
  }

  yield put(androidMobileServicesAvailabilityChecked(googleIsAvailable, huaweiIsAvailable))
}

export interface RemoteConfigValues {
  celoEducationUri: string | null
  celoEuroEnabled: boolean
  dappListApiUrl: string | null
  inviteRewardCusd: number
  inviteRewardWeeklyLimit: number
  inviteRewardsEnabled: boolean
  hideVerification: boolean
  showRaiseDailyLimitTarget: string | undefined
  walletConnectV1Enabled: boolean
  walletConnectV2Enabled: boolean
  logPhoneNumberTypeEnabled: boolean
  superchargeApy: number
  superchargeTokens: SuperchargeTokenConfig[]
  komenciUseLightProxy: boolean
  komenciAllowedDeployers: string[]
  pincodeUseExpandedBlocklist: boolean
  rewardPillText: string
  cashInButtonExpEnabled: boolean
  rampCashInButtonExpEnabled: boolean
  allowOtaTranslations: boolean
  linkBankAccountEnabled: boolean
  linkBankAccountStepTwoEnabled: boolean
  sentryTracesSampleRate: number
  sentryNetworkErrors: string[]
  biometryEnabled: boolean
  superchargeButtonType: SuperchargeButtonType
  maxNumRecentDapps: number
  skipVerification: boolean
  showPriceChangeIndicatorInBalances: boolean
  paymentDeepLinkHandler: PaymentDeepLinkHandler
  dappsWebViewEnabled: boolean
  skipProfilePicture: boolean
  finclusiveUnsupportedStates: string[]
  celoWithdrawalEnabledInExchange: boolean
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
      const { configValues }: { configValues: RemoteConfigValues | undefined } = yield race({
        configValues: call(fetchRemoteConfigValues),
        timeout: delay(FETCH_TIMEOUT_DURATION),
      })
      if (configValues) {
        Logger.setNetworkErrors(configValues.sentryNetworkErrors)
        yield put(updateRemoteConfigValues(configValues))
        lastLoadTime = Date.now()
      }
    }

    const action: SetAppState = yield take(Actions.SET_APP_STATE)
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
  const decodedParams = new URLSearchParamsReal(decodeURIComponent(query))
  const params: { [key: string]: any } = {}
  for (const [key, value] of decodedParams.entries()) {
    params[key] = parseValue(value)
  }
  return params
}

export function* handleDeepLink(action: OpenDeepLink) {
  const { deepLink, isSecureOrigin } = action
  Logger.debug(TAG, 'Handling deep link', deepLink)

  if (isWalletConnectDeepLink(deepLink)) {
    yield call(handleWalletConnectDeepLink, deepLink)
    return
  }

  const rawParams = parse(deepLink)
  if (rawParams.path) {
    if (rawParams.path.startsWith('/v/')) {
      yield put(receiveAttestationMessage(rawParams.path.substr(3), CodeInputType.DEEP_LINK))
    } else if (rawParams.path.startsWith('/payment')) {
      // TODO: contact our merchant partner and come up
      // with something that doesn't match /pay, maybe /merchantPay ?
      yield call(paymentDeepLinkHandlerMerchant, deepLink)
    } else if (rawParams.path.startsWith('/pay')) {
      yield call(handlePaymentDeeplink, deepLink)
    } else if (rawParams.path.startsWith('/dappkit')) {
      yield call(handleDappkitDeepLink, deepLink)
    } else if (rawParams.path === '/cashIn') {
      navigate(Screens.FiatExchangeCurrency, { flow: FiatExchangeFlow.CashIn })
    } else if (rawParams.pathname === '/bidali') {
      navigate(Screens.BidaliScreen, { currency: undefined })
    } else if (rawParams.path.startsWith('/cash-in-success')) {
      // Some providers append transaction information to the redirect links so can't check for strict equality
      const cicoSuccessParam = (rawParams.pathname?.match(/cash-in-success\/(.+)/) || [])[1]
      navigate(Screens.CashInSuccess, { provider: cicoSuccessParam.split('/')[0] })
      // Some providers append transaction information to the redirect links so can't check for strict equality
    } else if (rawParams.path.startsWith('/cash-in-failure')) {
      navigate(Screens.FiatExchange)
    } else if (isSecureOrigin && rawParams.pathname === '/openScreen' && rawParams.query) {
      // The isSecureOrigin is important. We don't want it to be possible to fire this deep link from outside
      // of our own notifications for security reasons.
      const params = convertQueryToScreenParams(rawParams.query)
      navigate(params.screen as keyof StackParamList, params)
    }
  }
}

export function* watchDeepLinks() {
  yield takeLatest(Actions.OPEN_DEEP_LINK, handleDeepLink)
}

export function* handleOpenUrl(action: OpenUrlAction) {
  const { url, openExternal, isSecureOrigin } = action
  const walletConnectEnabled: boolean = yield call(isWalletConnectEnabled, url)
  Logger.debug(TAG, 'Handling url', url)
  if (isDeepLink(url) || (walletConnectEnabled && isWalletConnectDeepLink(url))) {
    // Handle celo links directly, this avoids showing the "Open with App" sheet on Android
    yield call(handleDeepLink, openDeepLink(url, isSecureOrigin))
  } else if (/^https?:\/\//i.test(url) === true && !openExternal) {
    // We display http or https links using our in app browser, unless openExternal is forced
    navigate(Screens.WebViewScreen, { uri: url })
  } else {
    // Fallback
    yield call(navigateToURI, url)
  }
}

export function* handleOpenDapp(action: DappSelected) {
  const { dappUrl } = action.dapp
  const dappsWebViewEnabled = yield select(dappsWebViewEnabledSelector)

  if (true) {
    const walletConnectEnabled: boolean = yield call(isWalletConnectEnabled, dappUrl)
    if (isDeepLink(dappUrl) || (walletConnectEnabled && isWalletConnectDeepLink(dappUrl))) {
      yield call(handleDeepLink, openDeepLink(dappUrl, true))
    } else {
      navigate(Screens.WebViewScreen, { uri: dappUrl })
    }
  } else {
    yield call(handleOpenUrl, openUrl(dappUrl, true, true))
  }
}

export function* watchOpenUrl() {
  yield takeEvery(Actions.OPEN_URL, handleOpenUrl)
}

export function* watchDappSelected() {
  yield takeLatest(Actions.DAPP_SELECTED, handleOpenDapp)
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
  const appStateChannel = yield createAppStateChannel()
  while (true) {
    try {
      const newState = yield take(appStateChannel)
      Logger.debug(`${TAG}@monitorAppState`, `App changed state: ${newState}`)
      yield put(setAppState(newState))
    } catch (error) {
      ValoraAnalytics.track(AppEvents.app_state_error, { error: error.message })
      Logger.error(`${TAG}@monitorAppState`, `App state Error`, error)
    } finally {
      if (yield cancelled()) {
        appStateChannel.close()
      }
    }
  }
}

export function* handleSetAppState(action: SetAppState) {
  const requirePinOnAppOpen = yield select(getRequirePinOnAppOpen)
  const lastTimeBackgrounded = yield select(getLastTimeBackgrounded)
  const isPassedDoNotLockPeriod = Date.now() - lastTimeBackgrounded > DO_NOT_LOCK_PERIOD
  const isAppActive = action.state === 'active'

  if (requirePinOnAppOpen && isPassedDoNotLockPeriod && isAppActive) {
    yield put(appLock())
  }
}

export function* appSaga() {
  yield spawn(watchDeepLinks)
  yield spawn(watchOpenUrl)
  yield spawn(watchDappSelected)
  yield spawn(watchAppState)
  yield spawn(runVerificationMigration)
  yield takeLatest(Actions.SET_APP_STATE, handleSetAppState)
}
