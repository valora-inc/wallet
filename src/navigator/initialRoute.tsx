import { PincodeType, RecoveryPhraseInOnboardingStatus } from 'src/account/reducer'
import { MultichainBetaStatus } from 'src/app/actions'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'

export function getInitialRoute({
  choseToRestoreAccount,
  language,
  acceptedTerms,
  pincodeType,
  account,
  hasSeenVerificationNux,
  recoveryPhraseInOnboardingStatus,
  multichainBetaStatus,
}: {
  choseToRestoreAccount: boolean | undefined
  language: string | null
  acceptedTerms: boolean
  pincodeType: PincodeType
  account: string | null
  hasSeenVerificationNux: boolean
  recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus
  multichainBetaStatus: MultichainBetaStatus
}) {
  if (!language) {
    return Screens.Language
  } else if (!acceptedTerms || pincodeType === PincodeType.Unset) {
    // allow empty username
    // User didn't go far enough in onboarding, start again from education
    return Screens.Welcome
  } else if (!account) {
    return choseToRestoreAccount
      ? getFeatureGate(StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE)
        ? Screens.ImportSelect
        : Screens.ImportWallet
      : Screens.Welcome
  } else if (recoveryPhraseInOnboardingStatus === RecoveryPhraseInOnboardingStatus.InProgress) {
    return Screens.ProtectWallet
  } else if (!hasSeenVerificationNux) {
    return Screens.VerificationStartScreen
  } else if (
    getFeatureGate(StatsigFeatureGates.SHOW_MULTICHAIN_BETA_SCREEN) &&
    multichainBetaStatus === MultichainBetaStatus.NotSeen
  ) {
    return Screens.MultichainBeta
  } else {
    return Screens.TabNavigator
  }
}
