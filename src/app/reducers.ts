import { Platform } from 'react-native'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { Actions, ActionTypes, AppState, MultichainBetaStatus } from 'src/app/actions'
import { CeloNewsConfig } from 'src/celoNews/types'
import { DEEPLINK_PREFIX } from 'src/config'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { Screens } from 'src/navigator/Screens'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

const PERSISTED_DEEP_LINKS = [
  'https://valoraapp.com/share',
  `${DEEPLINK_PREFIX}://wallet/jumpstart`,
]

interface State {
  loggedIn: boolean
  phoneNumberVerified: boolean
  analyticsEnabled: boolean
  requirePinOnAppOpen: boolean
  appState: AppState
  locked: boolean
  lastTimeBackgrounded: number
  sessionId: string
  celoEducationUri: string | null
  activeScreen: Screens
  walletConnectV2Enabled: boolean
  // In 1.13 we had a critical error which requires a migration to fix. See |verificationMigration.ts|
  // for the migration code. We can remove all the code associated with this after some time has passed.
  logPhoneNumberTypeEnabled: boolean
  googleMobileServicesAvailable?: boolean
  huaweiMobileServicesAvailable?: boolean
  pincodeUseExpandedBlocklist: boolean
  sentryTracesSampleRate: number
  sentryNetworkErrors: string[]
  supportedBiometryType: BIOMETRY_TYPE | null
  fiatConnectCashInEnabled: boolean
  fiatConnectCashOutEnabled: boolean
  coinbasePayEnabled: boolean
  showSwapMenuInDrawerMenu: boolean
  maxSwapSlippagePercentage: number
  inviterAddress: string | null
  networkTimeoutSeconds: number
  celoNews: CeloNewsConfig
  hapticFeedbackEnabled: boolean
  pushNotificationRequestedUnixTime: number | null
  pushNotificationsEnabled: boolean
  inAppReviewLastInteractionTimestamp: number | null
  showNotificationSpotlight: boolean
  hideBalances: boolean
  multichainBetaStatus: MultichainBetaStatus
  pendingDeepLinks: PendingDeepLink[]
}

interface PendingDeepLink {
  url: string
  isSecureOrigin: boolean
}

const initialState = {
  loggedIn: false,
  phoneNumberVerified: false,
  analyticsEnabled: true,
  requirePinOnAppOpen: false,
  appState: AppState.Active,
  locked: false,
  lastTimeBackgrounded: 0,
  sessionId: '',
  celoEducationUri: null,
  activeScreen: Screens.Main,
  walletConnectV2Enabled: REMOTE_CONFIG_VALUES_DEFAULTS.walletConnectV2Enabled,
  logPhoneNumberTypeEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.logPhoneNumberTypeEnabled,
  googleMobileServicesAvailable: undefined,
  huaweiMobileServicesAvailable: undefined,
  pincodeUseExpandedBlocklist: REMOTE_CONFIG_VALUES_DEFAULTS.pincodeUseExpandedBlocklist,
  sentryTracesSampleRate: REMOTE_CONFIG_VALUES_DEFAULTS.sentryTracesSampleRate,
  sentryNetworkErrors: REMOTE_CONFIG_VALUES_DEFAULTS.sentryNetworkErrors.split(','),
  supportedBiometryType: null,
  fiatConnectCashInEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.fiatConnectCashInEnabled,
  fiatConnectCashOutEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.fiatConnectCashOutEnabled,
  coinbasePayEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.coinbasePayEnabled,
  showSwapMenuInDrawerMenu: REMOTE_CONFIG_VALUES_DEFAULTS.showSwapMenuInDrawerMenu,
  maxSwapSlippagePercentage: REMOTE_CONFIG_VALUES_DEFAULTS.maxSwapSlippagePercentage,
  inviterAddress: null,
  networkTimeoutSeconds: REMOTE_CONFIG_VALUES_DEFAULTS.networkTimeoutSeconds,
  celoNews: JSON.parse(REMOTE_CONFIG_VALUES_DEFAULTS.celoNews),
  hapticFeedbackEnabled: true,
  pushNotificationRequestedUnixTime: null,
  pushNotificationsEnabled: false,
  inAppReviewLastInteractionTimestamp: null,
  showNotificationSpotlight: false,
  hideBalances: false,
  multichainBetaStatus: MultichainBetaStatus.NotSeen,
  pendingDeepLinks: [],
}

function getPersistedDeepLinks(deepLinks: PendingDeepLink[]) {
  return deepLinks.filter((deepLink) =>
    PERSISTED_DEEP_LINKS.some((link) => deepLink.url.startsWith(link))
  )
}

export const appReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      const rehydratePayload = getRehydratePayload(action, 'app')
      return {
        ...state,
        ...rehydratePayload,
        appState: initialState.appState,
        locked: rehydratePayload.requirePinOnAppOpen ?? initialState.locked,
        sessionId: '',
        pendingDeepLinks: getPersistedDeepLinks(rehydratePayload.pendingDeepLinks ?? []),
      }
    }
    case Actions.SET_APP_STATE:
      let { appState, lastTimeBackgrounded } = state
      switch (action.state) {
        case 'background':
          if (Platform.OS === 'android') {
            lastTimeBackgrounded = Date.now()
          }
          appState = AppState.Background
          break
        case 'inactive': // occurs only on iOS
          lastTimeBackgrounded = Date.now()
          appState = AppState.Inactive
          break
        case 'active':
          appState = AppState.Active
          break
      }
      return {
        ...state,
        appState,
        lastTimeBackgrounded,
      }
    case Actions.SET_LOGGED_IN:
      return {
        ...state,
        loggedIn: action.loggedIn,
      }
    case Actions.SET_ANALYTICS_ENABLED:
      return {
        ...state,
        analyticsEnabled: action.enabled,
      }
    case Actions.SET_LOCK_WITH_PIN_ENABLED:
      return {
        ...state,
        requirePinOnAppOpen: action.enabled,
      }
    case Actions.LOCK:
      return {
        ...state,
        locked: true,
      }
    case Actions.UNLOCK:
      return {
        ...state,
        locked: false,
      }
    case Actions.SET_SESSION_ID:
      return {
        ...state,
        sessionId: action.sessionId,
      }
    case Actions.UPDATE_REMOTE_CONFIG_VALUES:
      return {
        ...state,
        celoEducationUri: action.configValues.celoEducationUri,
        walletConnectV2Enabled: action.configValues.walletConnectV2Enabled,
        logPhoneNumberTypeEnabled: action.configValues.logPhoneNumberTypeEnabled,
        pincodeUseExpandedBlocklist: action.configValues.pincodeUseExpandedBlocklist,
        sentryTracesSampleRate: action.configValues.sentryTracesSampleRate,
        sentryNetworkErrors: action.configValues.sentryNetworkErrors,
        fiatConnectCashInEnabled: action.configValues.fiatConnectCashInEnabled,
        fiatConnectCashOutEnabled: action.configValues.fiatConnectCashOutEnabled,
        coinbasePayEnabled: action.configValues.coinbasePayEnabled,
        showSwapMenuInDrawerMenu: action.configValues.showSwapMenuInDrawerMenu,
        maxSwapSlippagePercentage: action.configValues.maxSwapSlippagePercentage,
        networkTimeoutSeconds: action.configValues.networkTimeoutSeconds,
        celoNews: action.configValues.celoNews,
      }
    case Actions.ACTIVE_SCREEN_CHANGED:
      return {
        ...state,
        activeScreen: action.activeScreen,
      }
    case Actions.ANDROID_MOBILE_SERVICES_AVAILABILITY_CHECKED:
      return {
        ...state,
        googleMobileServicesAvailable: action.googleIsAvailable,
        huaweiMobileServicesAvailable: action.huaweiIsAvailable,
      }
    case Actions.SET_SUPPORTED_BIOMETRY_TYPE:
      return {
        ...state,
        supportedBiometryType: action.supportedBiometryType,
      }
    case Actions.PHONE_NUMBER_VERIFICATION_COMPLETED:
      return {
        ...state,
        phoneNumberVerified: true,
      }
    case Actions.PHONE_NUMBER_REVOKED:
      return {
        ...state,
        phoneNumberVerified: false,
      }
    case Actions.INVITE_LINK_CONSUMED:
      return {
        ...state,
        inviterAddress: action.inviterAddress,
      }
    case Actions.HAPTIC_FEEDBACK_SET:
      return {
        ...state,
        hapticFeedbackEnabled: action.hapticFeedbackEnabled,
      }
    case Actions.NOTIFICATION_SPOTLIGHT_SEEN:
      return {
        ...state,
        showNotificationSpotlight: false,
      }
    case Actions.PUSH_NOTIFICATIONS_PERMISSION_CHANGED:
      return {
        ...state,
        pushNotificationsEnabled: action.enabled,
        pushNotificationRequestedUnixTime: action.requestedInApp
          ? Date.now()
          : state.pushNotificationRequestedUnixTime,
      }
    case Actions.IN_APP_REVIEW_REQUESTED:
      return {
        ...state,
        inAppReviewLastInteractionTimestamp: action.inAppReviewLastInteractionTimestamp,
      }
    case Actions.TOGGLE_HIDE_BALANCES:
      return {
        ...state,
        hideBalances: !state.hideBalances,
      }
    case Actions.OPT_MULTICHAIN_BETA:
      return {
        ...state,
        multichainBetaStatus: action.optedIn
          ? MultichainBetaStatus.OptedIn
          : MultichainBetaStatus.OptedOut,
      }
    case Actions.DEEP_LINK_DEFERRED:
      return {
        ...state,
        pendingDeepLinks: [
          ...state.pendingDeepLinks,
          { url: action.deepLink, isSecureOrigin: action.isSecureOrigin },
        ],
      }
    case Actions.OPEN_DEEP_LINK:
      return {
        ...state,
        pendingDeepLinks: state.pendingDeepLinks.filter(
          (pendingDeepLink) => pendingDeepLink.url !== action.deepLink
        ),
      }
    default:
      return state
  }
}
