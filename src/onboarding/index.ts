export interface OnboardingExperimentParams {
  disableForcedBackup: boolean // Whether to enable/disable forced 24h backup.
  showRecoveryPhraseInOnboarding: boolean // Whether to show recovery phrase and backup options in onboarding.
  showCloudBackupFakeDoor: boolean // Whether to show cloud backup as a fakedoor recovery option. Only has effect if showRecoveryPhraseInOnboarding is true.
  useNewBackupFlowCopy: boolean // Whether to use new copy in the backup flow.
  showBackupAlert: boolean // Whether to show an alert in the sidenav if the user hasn't backed up.
  useNewBackupHomecard: boolean // Whether to use new designs for backup homecard.
}

export function getOnboardingExperimentParams(): OnboardingExperimentParams {
  // TODO (ACT-643): Replace function body with Statsig integration
  return {
    disableForcedBackup: false,
    showRecoveryPhraseInOnboarding: false,
    showCloudBackupFakeDoor: false,
    useNewBackupFlowCopy: false,
    showBackupAlert: false,
    useNewBackupHomecard: false,
  }
}
