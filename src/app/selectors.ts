import { RootState } from 'src/redux/reducers'

export const getRequirePinOnAppOpen = (state: RootState) => {
  return state.app.requirePinOnAppOpen
}

export const appStateSelector = (state: RootState) => {
  return state.app.appState
}

export const getAppLocked = (state: RootState) => {
  return state.app.locked
}

export const analyticsEnabledSelector = (state: RootState) => {
  return state.app.analyticsEnabled
}

export const getLastTimeBackgrounded = (state: RootState) => {
  return state.app.lastTimeBackgrounded
}

export const sessionIdSelector = (state: RootState) => {
  return state.app.sessionId
}

// this can be called with undefined state in the tests
export const walletConnectEnabledSelector = (state?: RootState) => ({
  v2: state?.app.walletConnectV2Enabled ?? false,
})

export const logPhoneNumberTypeEnabledSelector = (state: RootState) =>
  state.app.logPhoneNumberTypeEnabled

export const googleMobileServicesAvailableSelector = (state: RootState) =>
  state.app.googleMobileServicesAvailable

export const huaweiMobileServicesAvailableSelector = (state: RootState) =>
  state.app.huaweiMobileServicesAvailable

export const sentryTracesSampleRateSelector = (state: RootState) => state.app.sentryTracesSampleRate

export const sentryNetworkErrorsSelector = (state: RootState) => state.app.sentryNetworkErrors

export const supportedBiometryTypeSelector = (state: RootState) => state.app.supportedBiometryType

export const fiatConnectCashInEnabledSelector = (state: RootState) =>
  state.app.fiatConnectCashInEnabled
export const fiatConnectCashOutEnabledSelector = (state: RootState) =>
  state.app.fiatConnectCashOutEnabled

export const coinbasePayEnabledSelector = (state: RootState) => state.app.coinbasePayEnabled

export const maxSwapSlippagePercentageSelector = (state: RootState) =>
  state.app.maxSwapSlippagePercentage

export const phoneNumberVerifiedSelector = (state: RootState) => state.app.phoneNumberVerified

export const inviterAddressSelector = (state: RootState) => state.app.inviterAddress

export const networkTimeoutSecondsSelector = (state: RootState) => state.app.networkTimeoutSeconds

export const celoNewsConfigSelector = (state: RootState) => state.app.celoNews

export const hapticFeedbackEnabledSelector = (state: RootState) => state.app.hapticFeedbackEnabled

export const pushNotificationsEnabledSelector = (state: RootState) =>
  state.app.pushNotificationsEnabled

export const pushNotificationRequestedUnixTimeSelector = (state: RootState) =>
  state.app.pushNotificationRequestedUnixTime

export const inAppReviewLastInteractionTimestampSelector = (state: RootState) =>
  state.app.inAppReviewLastInteractionTimestamp

export const hideWalletBalancesSelector = (state: RootState) => state.app.hideBalances

export const multichainBetaStatusSelector = (state: RootState) => state.app.multichainBetaStatus

export const pendingDeepLinkSelector = (state: RootState) => state.app.pendingDeepLinks[0] ?? null
