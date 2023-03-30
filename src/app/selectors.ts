import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'
import { walletAddressSelector } from 'src/web3/selectors'

export const getRequirePinOnAppOpen = (state: RootState) => {
  return state.app.requirePinOnAppOpen
}

export const appStateSelector = (state: RootState) => {
  return state.app.appState
}

export const getAppLocked = (state: RootState) => {
  return state.app.locked
}

export const getLastTimeBackgrounded = (state: RootState) => {
  return state.app.lastTimeBackgrounded
}

export const sessionIdSelector = (state: RootState) => {
  return state.app.sessionId
}

export const numberVerifiedSelector = (state: RootState) => state.app.numberVerified

// this can be called with undefined state in the tests
export const walletConnectEnabledSelector = (state?: RootState) => ({
  v1: state?.app.walletConnectV1Enabled ?? false,
  v2: state?.app.walletConnectV2Enabled ?? false,
})

export const superchargeTokenConfigByTokenSelector = (state: RootState) =>
  state.app.superchargeTokenConfigByToken

export const rewardsEnabledSelector = createSelector(
  [walletAddressSelector, superchargeTokenConfigByTokenSelector],
  (address, superchargeTokenConfigByToken) =>
    !!address && Object.keys(superchargeTokenConfigByToken).length > 0
)

export const logPhoneNumberTypeEnabledSelector = (state: RootState) =>
  state.app.logPhoneNumberTypeEnabled

export const paymentDeepLinkHandlerSelector = (state: RootState) => state.app.paymentDeepLinkHandler

export const celoEuroEnabledSelector = (state: RootState) => state.app.celoEuroEnabled

export const googleMobileServicesAvailableSelector = (state: RootState) =>
  state.app.googleMobileServicesAvailable

export const huaweiMobileServicesAvailableSelector = (state: RootState) =>
  state.app.huaweiMobileServicesAvailable

export const rewardPillTextSelector = (state: RootState) => state.app.rewardPillText

export const sentryTracesSampleRateSelector = (state: RootState) => state.app.sentryTracesSampleRate

export const sentryNetworkErrorsSelector = (state: RootState) => state.app.sentryNetworkErrors

export const supportedBiometryTypeSelector = (state: RootState) => state.app.supportedBiometryType

export const activeScreenSelector = (state: RootState) => state.app.activeScreen

export const showPriceChangeIndicatorInBalancesSelector = (state: RootState) =>
  state.app.showPriceChangeIndicatorInBalances

export const skipVerificationSelector = (state: RootState) => state.app.skipVerification

export const fiatConnectCashInEnabledSelector = (state: RootState) =>
  state.app.fiatConnectCashInEnabled
export const fiatConnectCashOutEnabledSelector = (state: RootState) =>
  state.app.fiatConnectCashOutEnabled

export const coinbasePayEnabledSelector = (state: RootState) => state.app.coinbasePayEnabled

export const maxSwapSlippagePercentageSelector = (state: RootState) =>
  state.app.maxSwapSlippagePercentage

export const numberVerifiedCentrallySelector = (state: RootState) => state.app.phoneNumberVerified

const requireCPVSelector = (state: RootState) => state.app.requireCPV

export const phoneNumberVerifiedSelector = createSelector(
  [numberVerifiedCentrallySelector, numberVerifiedSelector, requireCPVSelector],
  (numberVerifiedCentrally, numberVerifiedDecentrally, requireCPV) =>
    requireCPV ? numberVerifiedCentrally : numberVerifiedCentrally || numberVerifiedDecentrally
)

export const phoneVerificationStatusSelector = createSelector(
  numberVerifiedSelector,
  numberVerifiedCentrallySelector,
  (numberVerifiedDecentralized, numberVerifiedCentralized) => {
    return {
      numberVerifiedDecentralized,
      numberVerifiedCentralized,
    }
  }
)

export const odisV1EnabledSelector = (state: RootState) => state.app.odisV1Enabled

export const shouldRunVerificationMigrationSelector = createSelector(
  [numberVerifiedCentrallySelector, numberVerifiedSelector, odisV1EnabledSelector],
  (numberVerifiedCentrally, numberVerifiedDecentrally, odisV1Enabled) =>
    numberVerifiedDecentrally && !numberVerifiedCentrally && odisV1Enabled
)

export const inviterAddressSelector = (state: RootState) => state.app.inviterAddress

export const networkTimeoutSecondsSelector = (state: RootState) => state.app.networkTimeoutSeconds

export const celoNewsConfigSelector = (state: RootState) => state.app.celoNews

export const hapticFeedbackEnabledSelector = (state: RootState) => state.app.hapticFeedbackEnabled

export const pushNotificationsEnabledSelector = (state: RootState) =>
  state.app.pushNotificationsEnabled
