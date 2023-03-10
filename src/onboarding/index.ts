export interface OnboardingExperimentParams {
  enableForcedBackup: boolean
  showRecoveryPhraseInOnboarding: boolean
  showCloudBackupFakeDoor: boolean // No effect if showRecoveryPhraseInOnboarding is false.
  useNewBackupFlowCopy: boolean // Whether to use new copy in the backup flow.
  showBackupAlert: boolean // Whether to show an alert in the sidenav if the user hasn't backed up.
  useNewBackupHomecard: boolean
}

export function getOnboardingExperimentParams(): OnboardingExperimentParams {
  // TODO (ACT-643): Replace function body with Statsig integration.
  return {
    enableForcedBackup: true,
    showRecoveryPhraseInOnboarding: false,
    showCloudBackupFakeDoor: false,
    useNewBackupFlowCopy: false,
    showBackupAlert: false,
    useNewBackupHomecard: false,
  }
}
