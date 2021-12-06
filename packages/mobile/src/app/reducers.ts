import { Platform } from 'react-native'
import { Actions, ActionTypes, AppState } from 'src/app/actions'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { Screens } from 'src/navigator/Screens'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

export interface State {
  loggedIn: boolean
  numberVerified: boolean
  analyticsEnabled: boolean
  requirePinOnAppOpen: boolean
  appState: AppState
  locked: boolean
  lastTimeBackgrounded: number
  sessionId: string
  minVersion: string | null
  celoEducationUri: string | null
  celoEuroEnabled: boolean
  inviteModalVisible: boolean
  activeScreen: Screens
  hideVerification: boolean
  showRaiseDailyLimitTarget: string | undefined
  walletConnectV1Enabled: boolean
  walletConnectV2Enabled: boolean
  rewardsPercent: number
  rewardsStartDate: number
  rewardsMax: number
  rewardsMin: number
  rewardsABTestThreshold: string
  // In 1.13 we had a critical error which requires a migration to fix. See |verificationMigration.ts|
  // for the migration code. We can remove all the code associated with this after some time has passed.
  ranVerificationMigrationAt: number | null | undefined
  logPhoneNumberTypeEnabled: boolean
  googleMobileServicesAvailable: boolean | undefined
  huaweiMobileServicesAvailable: boolean | undefined
  pincodeUseExpandedBlocklist: boolean
  rewardPillText?: {
    [lang: string]: string
  }
  cashInButtonExpEnabled: boolean
  multiTokenShowHomeBalances: boolean
  multiTokenUseSendFlow: boolean
  multiTokenUseUpdatedFeed: boolean
  linkBankAccountEnabled: boolean
}

const initialState = {
  loading: false,
  loggedIn: false,
  numberVerified: false,
  analyticsEnabled: true,
  requirePinOnAppOpen: false,
  appState: AppState.Active,
  locked: false,
  lastTimeBackgrounded: 0,
  sessionId: '',
  minVersion: null,
  celoEducationUri: null,
  celoEuroEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.celoEuroEnabled,
  inviteModalVisible: false,
  activeScreen: Screens.Main,
  hideVerification: REMOTE_CONFIG_VALUES_DEFAULTS.hideVerification,
  showRaiseDailyLimitTarget: undefined,
  walletConnectV1Enabled: REMOTE_CONFIG_VALUES_DEFAULTS.walletConnectV1Enabled,
  walletConnectV2Enabled: REMOTE_CONFIG_VALUES_DEFAULTS.walletConnectV2Enabled,
  rewardsPercent: REMOTE_CONFIG_VALUES_DEFAULTS.rewardsPercent,
  rewardsStartDate: REMOTE_CONFIG_VALUES_DEFAULTS.rewardsStartDate,
  rewardsMax: REMOTE_CONFIG_VALUES_DEFAULTS.rewardsMax,
  rewardsMin: REMOTE_CONFIG_VALUES_DEFAULTS.rewardsMin,
  rewardsABTestThreshold: REMOTE_CONFIG_VALUES_DEFAULTS.rewardsABTestThreshold,
  ranVerificationMigrationAt: null,
  logPhoneNumberTypeEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.logPhoneNumberTypeEnabled,
  googleMobileServicesAvailable: undefined,
  huaweiMobileServicesAvailable: undefined,
  pincodeUseExpandedBlocklist: REMOTE_CONFIG_VALUES_DEFAULTS.pincodeUseExpandedBlocklist,
  rewardPillText: JSON.parse(REMOTE_CONFIG_VALUES_DEFAULTS.rewardPillText),
  cashInButtonExpEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.cashInButtonExpEnabled,
  multiTokenShowHomeBalances: REMOTE_CONFIG_VALUES_DEFAULTS.multiTokenShowHomeBalances,
  multiTokenUseSendFlow: REMOTE_CONFIG_VALUES_DEFAULTS.multiTokenUseSendFlow,
  multiTokenUseUpdatedFeed: REMOTE_CONFIG_VALUES_DEFAULTS.multiTokenUseUpdatedFeed,
  linkBankAccountEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.linkBankAccountEnabled,
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
    case Actions.SET_NUMBER_VERIFIED:
      return {
        ...state,
        numberVerified: action.numberVerified,
      }
    case Actions.RESET_APP_OPENED_STATE:
      return {
        ...state,
        loggedIn: false,
        numberVerified: false,
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
    case Actions.MIN_APP_VERSION_DETERMINED:
      return {
        ...state,
        minVersion: action.minVersion,
      }
    case Actions.UPDATE_REMOTE_CONFIG_VALUES:
      return {
        ...state,
        hideVerification: action.configValues.hideVerification,
        showRaiseDailyLimitTarget: action.configValues.showRaiseDailyLimitTarget,
        celoEducationUri: action.configValues.celoEducationUri,
        celoEuroEnabled: action.configValues.celoEuroEnabled,
        walletConnectV1Enabled: action.configValues.walletConnectV1Enabled,
        walletConnectV2Enabled: action.configValues.walletConnectV2Enabled,
        rewardsPercent: action.configValues.rewardsPercent,
        rewardsStartDate: action.configValues.rewardsStartDate,
        rewardsMax: action.configValues.rewardsMax,
        rewardsMin: action.configValues.rewardsMin,
        rewardsABTestThreshold: action.configValues.rewardsABTestThreshold,
        logPhoneNumberTypeEnabled: action.configValues.logPhoneNumberTypeEnabled,
        pincodeUseExpandedBlocklist: action.configValues.pincodeUseExpandedBlocklist,
        rewardPillText: JSON.parse(action.configValues.rewardPillText),
        cashInButtonExpEnabled: action.configValues.cashInButtonExpEnabled,
        multiTokenShowHomeBalances: action.configValues.multiTokenShowHomeBalances,
        multiTokenUseSendFlow: action.configValues.multiTokenUseSendFlow,
        multiTokenUseUpdatedFeed: action.configValues.multiTokenUseUpdatedFeed,
        linkBankAccountEnabled: action.configValues.linkBankAccountEnabled,
      }
    case Actions.TOGGLE_INVITE_MODAL:
      return {
        ...state,
        inviteModalVisible: action.inviteModalVisible,
      }
    case Actions.ACTIVE_SCREEN_CHANGED:
      return {
        ...state,
        activeScreen: action.activeScreen,
      }
    case Actions.VERIFICATION_MIGRATION_RAN:
      return {
        ...state,
        ranVerificationMigrationAt: action.now,
        numberVerified: action.isVerified,
      }
    case Actions.ANDROID_MOBILE_SERVICES_AVAILABILITY_CHECKED:
      return {
        ...state,
        googleMobileServicesAvailable: action.googleIsAvailable,
        huaweiMobileServicesAvailable: action.huaweiIsAvailable,
      }
    default:
      return state
  }
}
