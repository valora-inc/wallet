import { createSelector } from 'reselect'
import {
  choseToRestoreAccountSelector,
  e164NumberSelector,
  recoveringFromStoreWipeSelector,
} from 'src/account/selectors'
import { hasExceededKomenciErrorQuota } from 'src/identity/feelessVerificationErrors'
import { e164NumberToSaltSelector } from 'src/identity/selectors'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import {
  isBalanceSufficientForSigRetrievalSelector,
  komenciContextSelector,
  shouldUseKomenciSelector,
  verificationStatusSelector,
} from 'src/verify/reducer'
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

export const verificationPossibleSelector = (state: RootState): boolean => {
  const centralPhoneVerificationEnabled = centralPhoneVerificationEnabledSelector(state)
  if (centralPhoneVerificationEnabled) {
    return true
  }

  const e164Number = e164NumberSelector(state)
  const saltCache = e164NumberToSaltSelector(state)
  const shouldUseKomenci = shouldUseKomenciSelector(state)
  const { komenci } = verificationStatusSelector(state)
  const hideVerification = hideVerificationSelector(state)
  if (hideVerification) {
    return false
  }

  const { errorTimestamps } = komenciContextSelector(state)

  return !!(
    !hasExceededKomenciErrorQuota(errorTimestamps) &&
    ((e164Number && saltCache[e164Number] && !komenci) ||
      isBalanceSufficientForSigRetrievalSelector(state) ||
      shouldUseKomenci)
  )
}

export const numberVerifiedSelector = (state: RootState) => state.app.numberVerified

// this can be called with undefined state in the tests
export const walletConnectEnabledSelector = (state?: RootState) => ({
  v1: state?.app.walletConnectV1Enabled ?? false,
  v2: state?.app.walletConnectV2Enabled ?? false,
})

export const hideVerificationSelector = (state: RootState) => state.app.hideVerification

export const ranVerificationMigrationSelector = (state: RootState) =>
  state.app.ranVerificationMigrationAt

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

export const inviteMethodSelector = (state: RootState) => state.app.inviteMethod

export const showGuidedOnboardingSelector = (state: RootState) => state.app.showGuidedOnboardingCopy

type StoreWipeRecoveryScreens = Extract<
  Screens,
  | Screens.NameAndPicture
  | Screens.ImportWallet
  | Screens.VerificationEducationScreen
  | Screens.VerificationInputScreen
>
type CreateAccountScreens = Extract<
  Screens,
  | Screens.NameAndPicture
  | Screens.PincodeSet
  | Screens.EnableBiometry
  | Screens.VerificationEducationScreen
  | Screens.VerificationInputScreen
>
type RestoreAccountScreens = CreateAccountScreens & Screens.ImportWallet

export const storeWipeRecoverySteps: { [key in StoreWipeRecoveryScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.ImportWallet]: 2,
  [Screens.VerificationEducationScreen]: 3,
  [Screens.VerificationInputScreen]: 3,
}
export const createAccountSteps: { [key in CreateAccountScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.PincodeSet]: 2,
  [Screens.EnableBiometry]: 3,
  [Screens.VerificationEducationScreen]: 4,
  [Screens.VerificationInputScreen]: 4,
}
export const restoreAccountSteps: { [key in RestoreAccountScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.PincodeSet]: 2,
  [Screens.EnableBiometry]: 3,
  [Screens.ImportWallet]: 4,
  [Screens.VerificationEducationScreen]: 5,
  [Screens.VerificationInputScreen]: 5,
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
      if (Object.keys(steps).includes(Screens.VerificationEducationScreen)) {
        totalSteps--
        step =
          step >
          (steps as Record<Screens.VerificationEducationScreen, number>)[
            Screens.VerificationEducationScreen
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

export const centralPhoneVerificationEnabledSelector = (state: RootState) =>
  state.app.centralPhoneVerificationEnabled

export const numberVerifiedCentrallySelector = (state: RootState) => state.app.phoneNumberVerified

export const phoneNumberVerifiedSelector = createSelector(
  [
    centralPhoneVerificationEnabledSelector,
    numberVerifiedCentrallySelector,
    numberVerifiedSelector,
  ],
  (centralPhoneVerificationEnabled, numberVerifiedCentrally, numberVerifiedDecentrally) =>
    centralPhoneVerificationEnabled
      ? numberVerifiedCentrally || numberVerifiedDecentrally
      : numberVerifiedDecentrally
)

export const shouldRunVerificationMigrationSelector = createSelector(
  [
    centralPhoneVerificationEnabledSelector,
    numberVerifiedCentrallySelector,
    numberVerifiedSelector,
  ],
  (centralPhoneVerificationEnabled, numberVerifiedCentrally, numberVerifiedDecentrally) =>
    centralPhoneVerificationEnabled && numberVerifiedDecentrally && !numberVerifiedCentrally
)

export const inviterAddressSelector = (state: RootState) => state.app.inviterAddress

export const networkTimeoutSecondsSelector = (state: RootState) => state.app.networkTimeoutSeconds

export const celoNewsConfigSelector = (state: RootState) => state.app.celoNews
