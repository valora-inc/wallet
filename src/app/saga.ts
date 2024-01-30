import { compressedPubKey } from '@celo/cryptographic-utils'
import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import { hexToBuffer } from '@celo/utils/lib/address'
import locales from 'locales'
import { AppState, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import InAppReview from 'react-native-in-app-review'
import * as Keychain from 'react-native-keychain'
import { findBestAvailableLanguage } from 'react-native-localize'
import { eventChannel } from 'redux-saga'
import { e164NumberSelector } from 'src/account/selectors'
import { AppEvents, InviteEvents } from 'src/analytics/Events'
import { HooksEnablePreviewOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  Actions,
  androidMobileServicesAvailabilityChecked,
  appLock,
  inAppReviewRequested,
  inviteLinkConsumed,
  minAppVersionDetermined,
  OpenDeepLink,
  openDeepLink,
  OpenUrlAction,
  phoneNumberVerificationMigrated,
  SetAppState,
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
  inviterAddressSelector,
  sentryNetworkErrorsSelector,
  shouldRunVerificationMigrationSelector,
} from 'src/app/selectors'
import { DEFAULT_APP_LANGUAGE, FETCH_TIMEOUT_DURATION, isE2EEnv } from 'src/config'
import { claimRewardsSuccess } from 'src/consumerIncentives/slice'
import { SuperchargeTokenConfigByToken } from 'src/consumerIncentives/types'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { DappConnectInfo } from 'src/dapps/types'
import { CeloNewsConfig } from 'src/exchange/types'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { appVersionDeprecationChannel, fetchRemoteConfigValues } from 'src/firebase/firebase'
import { initI18n } from 'src/i18n'
import {
  allowOtaTranslationsSelector,
  currentLanguageSelector,
  otaTranslationsAppVersionSelector,
} from 'src/i18n/selectors'
import { E164NumberToSaltType } from 'src/identity/reducer'
import { e164NumberToSaltSelector } from 'src/identity/selectors'
import { jumpstartLinkHandler } from 'src/jumpstart/jumpstartLinkHandler'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { retrieveSignedMessage } from 'src/pincode/authentication'
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
import { ensureError } from 'src/utils/ensureError'
import { isDeepLink, navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { isWalletConnectEnabled } from 'src/walletConnect/saga'
import {
  handleWalletConnectDeepLink,
  isWalletConnectDeepLink,
} from 'src/walletConnect/walletConnect'
import networkConfig from 'src/web3/networkConfig'
import {
  dataEncryptionKeySelector,
  mtwAddressSelector,
  walletAddressSelector,
} from 'src/web3/selectors'
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
  const bestLanguage = findBestAvailableLanguage(Object.keys(locales))?.languageTag

  yield* all([
    call(initializeSentry),
    call([ValoraAnalytics, 'init']),
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

export function* appVersionSaga() {
  const appVersionChannel = yield* call(appVersionDeprecationChannel)
  if (!appVersionChannel) {
    return
  }
  try {
    while (true) {
      const minRequiredVersion = yield* take(appVersionChannel)
      Logger.info(TAG, `Required min version: ${minRequiredVersion}`)
      // Note: The NavigatorWrapper will read this value from the store and
      // show the UpdateScreen if necessary.
      yield* put(minAppVersionDetermined(minRequiredVersion))
    }
  } catch (error) {
    Logger.error(`${TAG}@appVersionSaga`, 'Failed to watch app version', error)
  } finally {
    if (yield* cancelled()) {
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
    ValoraAnalytics.track(AppEvents.android_mobile_services_checked, {
      googleIsAvailable,
      huaweiIsAvailable,
    })
  }

  yield* put(androidMobileServicesAvailabilityChecked(googleIsAvailable, huaweiIsAvailable))
}

export interface RemoteConfigValues {
  celoEducationUri: string | null
  celoEuroEnabled: boolean
  dappListApiUrl: string | null
  inviteRewardCusd: number
  inviteRewardWeeklyLimit: number
  inviteRewardsVersion: string
  walletConnectV1Enabled: boolean
  walletConnectV2Enabled: boolean
  logPhoneNumberTypeEnabled: boolean
  superchargeApy: number
  superchargeTokenConfigByToken: SuperchargeTokenConfigByToken
  pincodeUseExpandedBlocklist: boolean
  rewardPillText: string
  rampCashInButtonExpEnabled: boolean
  allowOtaTranslations: boolean
  sentryTracesSampleRate: number
  sentryNetworkErrors: string[]
  maxNumRecentDapps: number
  skipVerification: boolean
  showPriceChangeIndicatorInBalances: boolean
  dappsWebViewEnabled: boolean
  fiatConnectCashInEnabled: boolean
  fiatConnectCashOutEnabled: boolean
  fiatAccountSchemaCountryOverrides: FiatAccountSchemaCountryOverrides
  dappConnectInfo: DappConnectInfo
  visualizeNFTsEnabledInHomeAssetsPage: boolean
  coinbasePayEnabled: boolean
  showSwapMenuInDrawerMenu: boolean
  maxSwapSlippagePercentage: number
  networkTimeoutSeconds: number
  dappFavoritesEnabled: boolean
  celoNews: CeloNewsConfig
  twelveWordMnemonicEnabled: boolean
  dappsMinimalDisclaimerEnabled: boolean
  priceImpactWarningThreshold: number
  superchargeRewardContractAddress: string
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
  Logger.debug(TAG, 'Handling deep link', deepLink)

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
      'dappkit',
      'cashIn',
      'bidali',
      'cash-in-success',
      'cash-in-failure',
      'openScreen',
      'share',
      'hooks',
    ]
    ValoraAnalytics.track(AppEvents.handle_deeplink, {
      pathStartsWith: pathParts[1].split('?')[0],
      fullPath: pathStartsWithAllowList.includes(pathStartsWith) ? rawParams.pathname : null,
      query: pathStartsWithAllowList.includes(pathStartsWith) ? rawParams.query : null,
    })
    if (rawParams.path.startsWith('/pay')) {
      yield* call(handlePaymentDeeplink, deepLink)
    } else if (rawParams.path.startsWith('/dappkit')) {
      yield* call(handleDappkitDeepLink, deepLink)
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
      ValoraAnalytics.track(InviteEvents.opened_via_invite_url, {
        inviterAddress,
      })
    } else if (pathParts.length === 3 && pathParts[1] === 'jumpstart') {
      const privateKey = pathParts[2]
      yield* call(jumpstartLinkHandler, privateKey, walletAddress)
    } else if (
      (yield* select(allowHooksPreviewSelector)) &&
      rawParams.pathname === '/hooks/enablePreview'
    ) {
      yield* call(handleEnableHooksPreviewDeepLink, deepLink, HooksEnablePreviewOrigin.Deeplink)
    }
  }
}

export function* watchDeepLinks() {
  yield* takeLatest(Actions.OPEN_DEEP_LINK, safely(handleDeepLink))
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

export function* watchOpenUrl() {
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
      ValoraAnalytics.track(AppEvents.app_state_error, { error: error.message })
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

export function* runCentralPhoneVerificationMigration() {
  const shouldRunVerificationMigration = yield* select(shouldRunVerificationMigrationSelector)
  if (!shouldRunVerificationMigration) {
    return
  }

  const privateDataEncryptionKey = yield* select(dataEncryptionKeySelector)
  if (!privateDataEncryptionKey) {
    Logger.warn(
      `${TAG}@runCentralPhoneVerificationMigration`,
      'No data encryption key was found in the store. This should never happen.'
    )
    return
  }

  const address = yield* select(walletAddressSelector)
  const mtwAddress = yield* select(mtwAddressSelector)
  const phoneNumber = yield* select(e164NumberSelector)
  const publicDataEncryptionKey = compressedPubKey(hexToBuffer(privateDataEncryptionKey))

  try {
    const signedMessage = yield* call(retrieveSignedMessage)
    if (!signedMessage) {
      Logger.warn(
        `${TAG}@runCentralPhoneVerificationMigration`,
        'No signed message was found for this user. Skipping CPV migration.'
      )
      return
    }
    if (!phoneNumber) {
      Logger.warn(
        `${TAG}@runCentralPhoneVerificationMigration`,
        'No phone number was found for this user. Skipping CPV migration.'
      )
      return
    }

    const saltCache: E164NumberToSaltType = yield* select(e164NumberToSaltSelector)
    const cachedSalt = saltCache[phoneNumber]
    if (!cachedSalt) {
      Logger.warn(
        `${TAG}@runCentralPhoneVerificationMigration`,
        'No salt was cached for phone number. Skipping CPV migration.'
      )
      return
    }

    Logger.debug(
      `${TAG}@runCentralPhoneVerificationMigration`,
      'Starting to run central phone verification migration'
    )

    const phoneHash = yield* call(getPhoneHash, phoneNumber, cachedSalt)
    const inviterAddress = yield* select(inviterAddressSelector)

    const response = yield* call(fetch, networkConfig.migratePhoneVerificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora ${address}:${signedMessage}`,
      },
      body: JSON.stringify({
        clientPlatform: Platform.OS,
        clientVersion: DeviceInfo.getVersion(),
        publicDataEncryptionKey,
        phoneNumber,
        pepper: cachedSalt,
        phoneHash,
        mtwAddress: mtwAddress ?? undefined,
        inviterAddress: inviterAddress ?? undefined,
      }),
    })

    if (response.status === 200) {
      yield* put(phoneNumberVerificationMigrated())
      Logger.debug(
        `${TAG}@runCentralPhoneVerificationMigration`,
        'Central phone verification migration completed successfully'
      )
    } else {
      throw new Error(yield* call([response, 'text']))
    }
  } catch (error) {
    Logger.warn(
      `${TAG}@runCentralPhoneVerificationMigration`,
      'Could not complete central phone verification migration',
      error
    )
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
      ValoraAnalytics.track(AppEvents.in_app_review_impression)
    } catch (err) {
      const error = ensureError(err)
      Logger.error(TAG, `Error while calling InAppReview.RequestInAppReview`, error)
      ValoraAnalytics.track(AppEvents.in_app_review_error, { error: error.message })
    }
  }
}

export function* watchAppReview() {
  // Triggers on successful payment, swap, or rewards claim
  yield* takeLatest(
    [SendActions.SEND_PAYMENT_SUCCESS, swapSuccess, claimRewardsSuccess],
    safely(requestInAppReview)
  )
}

export function* appSaga() {
  yield* spawn(watchDeepLinks)
  yield* spawn(watchOpenUrl)
  yield* spawn(watchAppState)
  yield* spawn(runCentralPhoneVerificationMigration)
  yield* takeLatest(Actions.SET_APP_STATE, safely(handleSetAppState))
  yield* spawn(watchAppReview)
}
