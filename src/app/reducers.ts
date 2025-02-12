import { BIOMETRY_TYPE } from '@divvi/react-native-keychain'
import { Platform } from 'react-native'
import { Actions, ActionTypes, AppState } from 'src/app/actions'
import { DEEP_LINK_URL_SCHEME } from 'src/config'
import { SupportedProtocolId } from 'src/divviProtocol/constants'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { Screens } from 'src/navigator/Screens'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { NetworkId } from 'src/transactions/types'

const PERSISTED_DEEP_LINKS = [
  'https://valoraapp.com/share',
  `${DEEP_LINK_URL_SCHEME}://wallet/jumpstart`,
]

interface State {
  phoneNumberVerified: boolean
  analyticsEnabled: boolean
  requirePinOnAppOpen: boolean
  appState: AppState
  locked: boolean
  lastTimeBackgrounded: number
  sessionId: string
  activeScreen: Screens
  // In 1.13 we had a critical error which requires a migration to fix. See |verificationMigration.ts|
  // for the migration code. We can remove all the code associated with this after some time has passed.
  googleMobileServicesAvailable?: boolean
  huaweiMobileServicesAvailable?: boolean
  supportedBiometryType: BIOMETRY_TYPE | null
  fiatConnectCashInEnabled: boolean
  fiatConnectCashOutEnabled: boolean
  inviterAddress: string | null
  hapticFeedbackEnabled: boolean
  pushNotificationRequestedUnixTime: number | null
  pushNotificationsEnabled: boolean
  inAppReviewLastInteractionTimestamp: number | null
  showNotificationSpotlight: boolean
  hideBalances: boolean
  pendingDeepLinks: PendingDeepLink[]
  divviRegistrations: {
    [networkId in NetworkId]?: SupportedProtocolId[]
  }
}

interface PendingDeepLink {
  url: string
  isSecureOrigin: boolean
}

const initialState = {
  phoneNumberVerified: false,
  analyticsEnabled: true,
  requirePinOnAppOpen: false,
  appState: AppState.Active,
  locked: false,
  lastTimeBackgrounded: 0,
  sessionId: '',
  activeScreen: Screens.Main,
  googleMobileServicesAvailable: undefined,
  huaweiMobileServicesAvailable: undefined,
  supportedBiometryType: null,
  fiatConnectCashInEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.fiatConnectCashInEnabled,
  fiatConnectCashOutEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.fiatConnectCashOutEnabled,
  inviterAddress: null,
  hapticFeedbackEnabled: true,
  pushNotificationRequestedUnixTime: null,
  pushNotificationsEnabled: false,
  inAppReviewLastInteractionTimestamp: null,
  showNotificationSpotlight: false,
  hideBalances: false,
  pendingDeepLinks: [],
  divviRegistrations: {},
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
        fiatConnectCashInEnabled: action.configValues.fiatConnectCashInEnabled,
        fiatConnectCashOutEnabled: action.configValues.fiatConnectCashOutEnabled,
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
    case Actions.DIVVI_REGISTRATION_COMPLETED:
      return {
        ...state,
        divviRegistrations: {
          ...state.divviRegistrations,
          [action.networkId]: [
            ...(state.divviRegistrations[action.networkId] ?? []),
            action.protocolId,
          ],
        },
      }
    default:
      return state
  }
}
