import { createSelector } from 'reselect'
import {
  choseToRestoreAccountSelector,
  recoveringFromStoreWipeSelector,
} from 'src/account/selectors'
import { Screens } from 'src/navigator/Screens'
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

export const createAccountCopyTestTypeSelector = (state: RootState) =>
  state.app.createAccountCopyTestType

export const maxSwapSlippagePercentageSelector = (state: RootState) =>
  state.app.maxSwapSlippagePercentage

export const showGuidedOnboardingSelector = (state: RootState) => state.app.showGuidedOnboardingCopy

type StoreWipeRecoveryScreens = Extract<
  Screens,
  | Screens.NameAndPicture
  | Screens.ImportWallet
  | Screens.VerificationStartScreen
  | Screens.VerificationCodeInputScreen
>
type CreateAccountScreens = Extract<
  Screens,
  | Screens.NameAndPicture
  | Screens.PincodeSet
  | Screens.EnableBiometry
  | Screens.VerificationStartScreen
  | Screens.VerificationCodeInputScreen
>
type RestoreAccountScreens = CreateAccountScreens & Screens.ImportWallet

export const storeWipeRecoverySteps: { [key in StoreWipeRecoveryScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.ImportWallet]: 2,
  [Screens.VerificationStartScreen]: 3,
  [Screens.VerificationCodeInputScreen]: 3,
}
export const createAccountSteps: { [key in CreateAccountScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.PincodeSet]: 2,
  [Screens.EnableBiometry]: 3,
  [Screens.VerificationStartScreen]: 4,
  [Screens.VerificationCodeInputScreen]: 4,
}
export const restoreAccountSteps: { [key in RestoreAccountScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.PincodeSet]: 2,
  [Screens.EnableBiometry]: 3,
  [Screens.ImportWallet]: 4,
  [Screens.VerificationStartScreen]: 5,
  [Screens.VerificationCodeInputScreen]: 5,
}

// The logic in this selector should be moved to a hook when all registration
// screens are function components
export const registrationStepsSelector = createSelector(
  [
    choseToRestoreAccountSelector,
    supportedBiometryTypeSelector,
    activeScreenSelector,
    recoveringFromStoreWipeSelector,
    skipVerificationSelector,
  ],
  (
    chooseRestoreAccount,
    supportedBiometryType,
    activeScreen,
    recoveringFromStoreWipe,
    skipVerification
  ) => {
    let steps
    let totalSteps
    let step
    if (recoveringFromStoreWipe) {
      steps = storeWipeRecoverySteps
      totalSteps = 3
      step = storeWipeRecoverySteps[activeScreen as StoreWipeRecoveryScreens]
    } else if (chooseRestoreAccount) {
      steps = restoreAccountSteps
      totalSteps = 5
      step = restoreAccountSteps[activeScreen as RestoreAccountScreens]
    } else {
      steps = createAccountSteps
      totalSteps = 4
      step = createAccountSteps[activeScreen as CreateAccountScreens]
    }

    if (supportedBiometryType === null) {
      if (Object.keys(steps).includes(Screens.EnableBiometry)) {
        totalSteps--
        step =
          step > (steps as Record<Screens.EnableBiometry, number>)[Screens.EnableBiometry]
            ? step - 1
            : step
      }
    }
    if (skipVerification) {
      if (Object.keys(steps).includes(Screens.VerificationStartScreen)) {
        totalSteps--
        step =
          step >
          (steps as Record<Screens.VerificationStartScreen, number>)[
            Screens.VerificationStartScreen
          ]
            ? step - 1
            : step
      }
    }

    return {
      step,
      totalSteps,
    }
  }
)

export const numberVerifiedCentrallySelector = (state: RootState) => state.app.phoneNumberVerified

export const phoneNumberVerifiedSelector = createSelector(
  [numberVerifiedCentrallySelector, numberVerifiedSelector],
  (numberVerifiedCentrally, numberVerifiedDecentrally) =>
    numberVerifiedCentrally || numberVerifiedDecentrally
)

export const shouldRunVerificationMigrationSelector = createSelector(
  [numberVerifiedCentrallySelector, numberVerifiedSelector],
  (numberVerifiedCentrally, numberVerifiedDecentrally) =>
    numberVerifiedDecentrally && !numberVerifiedCentrally
)

export const inviterAddressSelector = (state: RootState) => state.app.inviterAddress

export const networkTimeoutSecondsSelector = (state: RootState) => state.app.networkTimeoutSeconds

export const celoNewsConfigSelector = (state: RootState) => state.app.celoNews
