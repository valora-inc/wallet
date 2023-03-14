import { defaultExperimentParamValues } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import { getExperimentParams } from 'src/statsig'

export interface OnboardingExperimentParams {
  enableForcedBackup: boolean
  showRecoveryPhraseInOnboarding: boolean
  showCloudBackupFakeDoor: boolean // No effect if showRecoveryPhraseInOnboarding is false.
  useNewBackupFlowCopy: boolean
  showBackupAlert: boolean // Whether to show an alert in the sidenav if the user hasn't backed up.
  useNewBackupHomeCard: boolean
}

export function getOnboardingExperimentParams(): OnboardingExperimentParams {
  return getExperimentParams(
    StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING,
    defaultExperimentParamValues[StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING]
  )
}
