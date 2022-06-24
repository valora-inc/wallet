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
import { accountAddressSelector, currentAccountSelector } from 'src/web3/selectors'

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
})

export const hideVerificationSelector = (state: RootState) => state.app.hideVerification

export const ranVerificationMigrationSelector = (state: RootState) =>
  state.app.ranVerificationMigrationAt

// showRaiseDailyLimitTarget is an account string that represents the cutoff of which accounts
// should return true. By doing a string comparison, if the user's account is lower than the
// target we'll return true and false otherwise.
export const showRaiseDailyLimitSelector = createSelector(
  [currentAccountSelector, (state) => state.app.showRaiseDailyLimitTarget],
  (account, showRaiseDailyLimitTarget) => {
    if (!showRaiseDailyLimitTarget || !account) {
      return false
    }
    return account < showRaiseDailyLimitTarget
  }
)

export const rewardsEnabledSelector = createSelector(
  [accountAddressSelector, (state) => state.app.superchargeTokens],
  (address, superchargeTokens) => !!address && superchargeTokens.length > 0
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

export const linkBankAccountEnabledSelector = (state: RootState) => state.app.linkBankAccountEnabled

export const linkBankAccountStepTwoEnabledSelector = (state: RootState) =>
  state.app.linkBankAccountStepTwoEnabled && state.account.finclusiveRegionSupported

export const sentryTracesSampleRateSelector = (state: RootState) => state.app.sentryTracesSampleRate

export const sentryNetworkErrorsSelector = (state: RootState) => state.app.sentryNetworkErrors

export const supportedBiometryTypeSelector = (state: RootState) => state.app.supportedBiometryType

export const biometryEnabledSelector = (state: RootState) =>
  state.app.biometryEnabled && !!state.app.supportedBiometryType

export const activeScreenSelector = (state: RootState) => state.app.activeScreen

export const dappsListApiUrlSelector = (state: RootState) => state.app.dappListApiUrl

export const maxNumRecentDappsSelector = (state: RootState) => state.app.maxNumRecentDapps

export const recentDappsSelector = (state: RootState) => state.app.recentDapps

export const showPriceChangeIndicatorInBalancesSelector = (state: RootState) =>
  state.app.showPriceChangeIndicatorInBalances

export const superchargeButtonTypeSelector = (state: RootState) => state.app.superchargeButtonType

export const skipVerificationSelector = (state: RootState) => state.app.skipVerification

export const dappsWebViewEnabledSelector = (state: RootState) => state.app.dappsWebViewEnabled

export const activeDappSelector = (state: RootState) =>
  state.app.dappsWebViewEnabled ? state.app.activeDapp : null

export const finclusiveUnsupportedStatesSelector = (state: RootState) =>
  state.app.finclusiveUnsupportedStates

type StoreWipeRecoveryScreens = Extract<
  Screens,
  | Screens.NameAndPicture
  | Screens.ImportWallet
  | Screens.VerificationEducationScreen
  | Screens.VerificationInputScreen
  | Screens.NuxInterests
>
type CreateAccountScreens = Extract<
  Screens,
  | Screens.NameAndPicture
  | Screens.PincodeSet
  | Screens.EnableBiometry
  | Screens.VerificationEducationScreen
  | Screens.VerificationInputScreen
  | Screens.NuxInterests
>
type RestoreAccountScreens = CreateAccountScreens & Screens.ImportWallet

export const storeWipeRecoverySteps: { [key in StoreWipeRecoveryScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.ImportWallet]: 2,
  [Screens.VerificationEducationScreen]: 3,
  [Screens.VerificationInputScreen]: 3,
  [Screens.NuxInterests]: 4,
}
export const createAccountSteps: { [key in CreateAccountScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.PincodeSet]: 2,
  [Screens.EnableBiometry]: 3,
  [Screens.VerificationEducationScreen]: 4,
  [Screens.VerificationInputScreen]: 4,
  [Screens.NuxInterests]: 5,
}
export const restoreAccountSteps: { [key in RestoreAccountScreens]: number } = {
  [Screens.NameAndPicture]: 1,
  [Screens.PincodeSet]: 2,
  [Screens.EnableBiometry]: 3,
  [Screens.ImportWallet]: 4,
  [Screens.VerificationEducationScreen]: 5,
  [Screens.VerificationInputScreen]: 5,
  [Screens.NuxInterests]: 6,
}
// The logic in this selector should be moved to a hook when all registration
// screens are function components
export const registrationStepsSelector = createSelector(
  [
    choseToRestoreAccountSelector,
    biometryEnabledSelector,
    activeScreenSelector,
    recoveringFromStoreWipeSelector,
    skipVerificationSelector,
  ],
  (
    chooseRestoreAccount,
    biometryEnabled,
    activeScreen,
    recoveringFromStoreWipe,
    skipVerification
  ) => {
    let steps
    let totalSteps
    let step
    if (recoveringFromStoreWipe) {
      steps = storeWipeRecoverySteps
      totalSteps = 4
      step = storeWipeRecoverySteps[activeScreen as StoreWipeRecoveryScreens]
    } else if (chooseRestoreAccount) {
      steps = restoreAccountSteps
      totalSteps = 6
      step = restoreAccountSteps[activeScreen as RestoreAccountScreens]
    } else {
      steps = createAccountSteps
      totalSteps = 5
      step = createAccountSteps[activeScreen as CreateAccountScreens]
    }

    if (!biometryEnabled) {
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
