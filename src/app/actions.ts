import { BIOMETRY_TYPE } from '@divvi/react-native-keychain'
import { RemoteConfigValues } from 'src/app/saga'
import { SupportedProtocolId } from 'src/divviProtocol/constants'
import { Screens } from 'src/navigator/Screens'
import { NetworkId } from 'src/transactions/types'

// https://facebook.github.io/react-native/docs/appstate
export enum AppState {
  Background = 'Background',
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum Actions {
  SET_APP_STATE = 'APP/SET_APP_STATE',
  SET_SUPPORTED_BIOMETRY_TYPE = 'APP/SET_SUPPORTED_BIOMETRY_TYPE',
  OPEN_DEEP_LINK = 'APP/OPEN_DEEP_LINK',
  DEEP_LINK_DEFERRED = 'APP/DEEP_LINK_DEFERRED',
  SET_ANALYTICS_ENABLED = 'APP/SET_ANALYTICS_ENABLED',
  SET_LOCK_WITH_PIN_ENABLED = 'APP/SET_LOCK_WITH_PIN_ENABLED',
  LOCK = 'APP/LOCK',
  UNLOCK = 'APP/UNLOCK',
  SET_SESSION_ID = 'SET_SESSION_ID',
  OPEN_URL = 'APP/OPEN_URL',
  UPDATE_REMOTE_CONFIG_VALUES = 'APP/UPDATE_REMOTE_CONFIG_VALUES',
  ACTIVE_SCREEN_CHANGED = 'APP/ACTIVE_SCREEN_CHANGED',
  APP_MOUNTED = 'APP/APP_MOUNTED',
  APP_UNMOUNTED = 'APP/APP_UNMOUNTED',
  ANDROID_MOBILE_SERVICES_AVAILABILITY_CHECKED = 'APP/ANDROID_MOBILE_SERVICES_AVAILABILITY_CHECKED',
  PHONE_NUMBER_VERIFICATION_COMPLETED = 'APP/PHONE_NUMBER_VERIFICATION_COMPLETED',
  PHONE_NUMBER_REVOKED = 'APP/PHONE_NUMBER_REVOKED',
  INVITE_LINK_CONSUMED = 'APP/INVITE_LINK_CONSUMED',
  HAPTIC_FEEDBACK_SET = 'APP/HAPTIC_FEEDBACK_SET',
  PUSH_NOTIFICATIONS_PERMISSION_CHANGED = 'APP/PUSH_NOTIFICATIONS_PERMISSION_CHANGED',
  IN_APP_REVIEW_REQUESTED = 'APP/IN_APP_REVIEW_REQUESTED',
  NOTIFICATION_SPOTLIGHT_SEEN = 'APP/NOTIFICATION_SPOTLIGHT_SEEN',
  TOGGLE_HIDE_BALANCES = 'APP/TOGGLE_HIDE_BALANCES',
  DIVVI_REGISTRATION_COMPLETED = 'APP/DIVVI_REGISTRATION_COMPLETED',
}

export interface SetAppState {
  type: Actions.SET_APP_STATE
  state: string
}

interface SetSupportedBiometryType {
  type: Actions.SET_SUPPORTED_BIOMETRY_TYPE
  supportedBiometryType: BIOMETRY_TYPE | null
}

export interface OpenDeepLink {
  type: Actions.OPEN_DEEP_LINK
  deepLink: string
  isSecureOrigin: boolean
}

interface DeepLinkDeferred {
  type: Actions.DEEP_LINK_DEFERRED
  deepLink: string
  isSecureOrigin: boolean
}

interface SetAnalyticsEnabled {
  type: Actions.SET_ANALYTICS_ENABLED
  enabled: boolean
}

interface SetRequirePinOnAppOpen {
  type: Actions.SET_LOCK_WITH_PIN_ENABLED
  enabled: boolean
}

interface ActiveScreenChangedAction {
  type: Actions.ACTIVE_SCREEN_CHANGED
  activeScreen: Screens
}

export interface Lock {
  type: Actions.LOCK
}

export interface Unlock {
  type: Actions.UNLOCK
}

export interface AppMounted {
  type: Actions.APP_MOUNTED
}

export interface AppUnmounted {
  type: Actions.APP_UNMOUNTED
}

export interface SetSessionId {
  type: Actions.SET_SESSION_ID
  sessionId: string
}

export interface OpenUrlAction {
  type: Actions.OPEN_URL
  url: string
  openExternal: boolean
  isSecureOrigin: boolean
}

export interface UpdateConfigValuesAction {
  type: Actions.UPDATE_REMOTE_CONFIG_VALUES
  configValues: RemoteConfigValues
}

export interface AndroidMobileServicesAvailabilityChecked {
  type: Actions.ANDROID_MOBILE_SERVICES_AVAILABILITY_CHECKED
  googleIsAvailable: boolean | undefined
  huaweiIsAvailable: boolean | undefined
}

export interface PhoneNumberVerificationCompleted {
  type: Actions.PHONE_NUMBER_VERIFICATION_COMPLETED
  e164PhoneNumber: string
  countryCode: string | null
}

export interface PhoneNumberRevoked {
  type: Actions.PHONE_NUMBER_REVOKED
  e164PhoneNumber: string
}

export interface InviteLinkConsumed {
  type: Actions.INVITE_LINK_CONSUMED
  inviterAddress: string
}

interface HapticFeedbackSet {
  type: Actions.HAPTIC_FEEDBACK_SET
  hapticFeedbackEnabled: boolean
}

export interface PushNotificationsPermissionChanged {
  type: Actions.PUSH_NOTIFICATIONS_PERMISSION_CHANGED
  enabled: boolean
  requestedInApp: boolean
}

export interface inAppReviewRequested {
  type: Actions.IN_APP_REVIEW_REQUESTED
  inAppReviewLastInteractionTimestamp: number | null
}

export interface NotificationSpotlightSeen {
  type: Actions.NOTIFICATION_SPOTLIGHT_SEEN
}

interface ToggleHideBalances {
  type: Actions.TOGGLE_HIDE_BALANCES
}

interface DivviRegistrationCompleted {
  type: Actions.DIVVI_REGISTRATION_COMPLETED
  networkId: NetworkId
  protocolId: SupportedProtocolId
}

export type ActionTypes =
  | SetAppState
  | SetSupportedBiometryType
  | OpenDeepLink
  | SetAnalyticsEnabled
  | SetRequirePinOnAppOpen
  | Lock
  | Unlock
  | SetSessionId
  | OpenUrlAction
  | UpdateConfigValuesAction
  | ActiveScreenChangedAction
  | AppMounted
  | AppUnmounted
  | AndroidMobileServicesAvailabilityChecked
  | PhoneNumberVerificationCompleted
  | PhoneNumberRevoked
  | InviteLinkConsumed
  | HapticFeedbackSet
  | PushNotificationsPermissionChanged
  | inAppReviewRequested
  | NotificationSpotlightSeen
  | ToggleHideBalances
  | DeepLinkDeferred
  | DivviRegistrationCompleted

export const setAppState = (state: string): SetAppState => ({
  type: Actions.SET_APP_STATE,
  state,
})

export const setSupportedBiometryType = (supportedBiometryType: BIOMETRY_TYPE | null) => ({
  type: Actions.SET_SUPPORTED_BIOMETRY_TYPE,
  supportedBiometryType,
})

export const openDeepLink = (deepLink: string, isSecureOrigin: boolean = false): OpenDeepLink => {
  return {
    type: Actions.OPEN_DEEP_LINK,
    deepLink,
    isSecureOrigin,
  }
}

export const deepLinkDeferred = (deepLink: string, isSecureOrigin: boolean): DeepLinkDeferred => {
  return {
    type: Actions.DEEP_LINK_DEFERRED,
    deepLink,
    isSecureOrigin,
  }
}

export const setAnalyticsEnabled = (enabled: boolean): SetAnalyticsEnabled => ({
  type: Actions.SET_ANALYTICS_ENABLED,
  enabled,
})

export const setRequirePinOnAppOpen = (enabled: boolean): SetRequirePinOnAppOpen => ({
  type: Actions.SET_LOCK_WITH_PIN_ENABLED,
  enabled,
})

export const appLock = (): Lock => ({
  type: Actions.LOCK,
})

export const appUnlock = (): Unlock => ({
  type: Actions.UNLOCK,
})

export const appMounted = (): AppMounted => ({
  type: Actions.APP_MOUNTED,
})

export const appUnmounted = (): AppUnmounted => ({
  type: Actions.APP_UNMOUNTED,
})

export const setSessionId = (sessionId: string) => ({
  type: Actions.SET_SESSION_ID,
  sessionId,
})

export const openUrl = (
  url: string,
  openExternal = false,
  isSecureOrigin = false
): OpenUrlAction => ({
  type: Actions.OPEN_URL,
  url,
  openExternal,
  isSecureOrigin,
})

export const updateRemoteConfigValues = (
  configValues: RemoteConfigValues
): UpdateConfigValuesAction => ({
  type: Actions.UPDATE_REMOTE_CONFIG_VALUES,
  configValues,
})

export const activeScreenChanged = (activeScreen: Screens): ActiveScreenChangedAction => ({
  type: Actions.ACTIVE_SCREEN_CHANGED,
  activeScreen,
})

export const androidMobileServicesAvailabilityChecked = (
  googleIsAvailable: boolean | undefined,
  huaweiIsAvailable: boolean | undefined
): AndroidMobileServicesAvailabilityChecked => ({
  type: Actions.ANDROID_MOBILE_SERVICES_AVAILABILITY_CHECKED,
  googleIsAvailable,
  huaweiIsAvailable,
})

export const phoneNumberVerificationCompleted = (
  e164PhoneNumber: string,
  countryCode: string | null
): PhoneNumberVerificationCompleted => {
  return {
    type: Actions.PHONE_NUMBER_VERIFICATION_COMPLETED,
    e164PhoneNumber,
    countryCode,
  }
}

export const phoneNumberRevoked = (e164PhoneNumber: string): PhoneNumberRevoked => {
  return {
    type: Actions.PHONE_NUMBER_REVOKED,
    e164PhoneNumber,
  }
}

export const inviteLinkConsumed = (inviterAddress: string): InviteLinkConsumed => {
  return {
    type: Actions.INVITE_LINK_CONSUMED,
    inviterAddress,
  }
}

export const hapticFeedbackSet = (hapticFeedbackEnabled: boolean): HapticFeedbackSet => {
  return {
    type: Actions.HAPTIC_FEEDBACK_SET,
    hapticFeedbackEnabled,
  }
}

export const pushNotificationsPermissionChanged = (
  enabled: boolean,
  requestedInApp: boolean
): PushNotificationsPermissionChanged => {
  return {
    type: Actions.PUSH_NOTIFICATIONS_PERMISSION_CHANGED,
    enabled,
    requestedInApp,
  }
}

export const inAppReviewRequested = (
  inAppReviewLastInteractionTimestamp: number
): inAppReviewRequested => {
  return {
    type: Actions.IN_APP_REVIEW_REQUESTED,
    inAppReviewLastInteractionTimestamp,
  }
}

export const notificationSpotlightSeen = (): NotificationSpotlightSeen => {
  return {
    type: Actions.NOTIFICATION_SPOTLIGHT_SEEN,
  }
}

export const toggleHideBalances = (): ToggleHideBalances => {
  return {
    type: Actions.TOGGLE_HIDE_BALANCES,
  }
}

export const divviRegistrationCompleted = (
  networkId: NetworkId,
  protocolId: SupportedProtocolId
): DivviRegistrationCompleted => {
  return {
    type: Actions.DIVVI_REGISTRATION_COMPLETED,
    networkId,
    protocolId,
  }
}
