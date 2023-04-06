import { PincodeType, RecoveryPhraseInOnboardingStatus } from 'src/account/reducer'
import { Screens } from 'src/navigator/Screens'

export function getInitialRoute({
  choseToRestoreAccount,
  language,
  acceptedTerms,
  pincodeType,
  account,
  hasSeenVerificationNux,
  recoveryPhraseInOnboardingStatus,
}: {
  choseToRestoreAccount: boolean | undefined
  language: string | null
  acceptedTerms: boolean
  pincodeType: PincodeType
  account: string | null
  hasSeenVerificationNux: boolean
  recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus
}) {
  if (!language) {
    return Screens.Language
  } else if (!acceptedTerms || pincodeType === PincodeType.Unset) {
    // allow empty username
    // User didn't go far enough in onboarding, start again from education
    return Screens.Welcome
  } else if (!account) {
    return choseToRestoreAccount ? Screens.ImportWallet : Screens.Welcome
  } else if (recoveryPhraseInOnboardingStatus === RecoveryPhraseInOnboardingStatus.Seen) {
    return Screens.ProtectWallet
  } else if (!hasSeenVerificationNux) {
    return Screens.VerificationStartScreen
  } else {
    return Screens.DrawerNavigator
  }
}
