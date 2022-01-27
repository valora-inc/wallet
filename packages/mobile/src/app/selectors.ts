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
  v2: state?.app.walletConnectV2Enabled ?? false,
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

export const rewardsThresholdSelector = (state: RootState) => state.app.rewardsABTestThreshold
export const rewardsEnabledSelector = createSelector(
  [accountAddressSelector, rewardsThresholdSelector],
  (address, rewardsThreshold) => {
    return address! < rewardsThreshold
  }
)

export const logPhoneNumberTypeEnabledSelector = (state: RootState) =>
  state.app.logPhoneNumberTypeEnabled

export const celoEuroEnabledSelector = (state: RootState) => state.app.celoEuroEnabled

export const googleMobileServicesAvailableSelector = (state: RootState) =>
  state.app.googleMobileServicesAvailable

export const huaweiMobileServicesAvailableSelector = (state: RootState) =>
  state.app.huaweiMobileServicesAvailable

export const rewardPillTextSelector = (state: RootState) => state.app.rewardPillText

export const multiTokenShowHomeBalancesSelector = (state: RootState) =>
  state.app.multiTokenShowHomeBalances
export const multiTokenUseSendFlowSelector = (state: RootState) => state.app.multiTokenUseSendFlow
export const multiTokenUseUpdatedFeedSelector = (state: RootState) =>
  state.app.multiTokenUseUpdatedFeed

export const linkBankAccountEnabledSelector = (state: RootState) => state.app.linkBankAccountEnabled

export const sentryTracesSampleRateSelector = (state: RootState) => state.app.sentryTracesSampleRate

export const supportedBiometryTypeSelector = (state: RootState) => state.app.supportedBiometryType

export const biometryEnabledSelector = (state: RootState) =>
  state.app.biometryEnabled && !!state.app.supportedBiometryType

export const useBiometrySelector = (state: RootState) => state.app.useBiometry

export const activeScreenSelector = (state: RootState) => state.app.activeScreen

export const dappsListApiUrlSelector = (state: RootState) => state.app.dappListApiUrl

export const superchargeButtonTypeSelector = (state: RootState) => state.app.superchargeButtonType

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
    biometryEnabledSelector,
    activeScreenSelector,
    recoveringFromStoreWipeSelector,
  ],
  (chooseRestoreAccount, biometryEnabled, activeScreen, recoveringFromStoreWipe) => {
    if (recoveringFromStoreWipe) {
      return {
        step: storeWipeRecoverySteps[activeScreen as StoreWipeRecoveryScreens],
        totalSteps: 3,
      }
    }

    if (chooseRestoreAccount) {
      if (biometryEnabled) {
        return { step: restoreAccountSteps[activeScreen as RestoreAccountScreens], totalSteps: 5 }
      }
      // remove biometry screen from step
      const step = restoreAccountSteps[activeScreen as RestoreAccountScreens]
      return { step: step > 3 ? step - 1 : step, totalSteps: 4 }
    }

    if (biometryEnabled) {
      return { step: createAccountSteps[activeScreen as CreateAccountScreens], totalSteps: 4 }
    }
    // remove biometry screen from step
    const step = createAccountSteps[activeScreen as CreateAccountScreens]
    return { step: step > 3 ? step - 1 : step, totalSteps: 3 }
  }
)
