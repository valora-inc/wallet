export enum AdventureCardName {
  Add = 'add',
  Profile = 'profile',
  LearnPoints = 'learnPoints',
  Earn = 'earn',
}

export enum ToggleableOnboardingFeatures {
  // Enabled Cloud Backup feature in the app, shows setup option in settings
  // and restore option in onboarding.
  CloudBackup = 'CloudBackup',
  // Shows Cloud Backup as a setup option in onboarding ONLY if CloudBackup is true
  CloudBackupSetupInOnboarding = 'CloudBackupSetupInOnboarding',
  // Whether or not CPV is shown in onboarding
  PhoneVerification = 'PhoneVerification',
  // Whether the Biometry screen is shown directly after PincodeSet screen in onboarding
  EnableBiometry = 'EnableBiometry',
  // Shows the ProtectWallet screen in onboarding if at least one of CloudBackup or
  // CloudBackupSetupInOnboarding is false
  ProtectWallet = 'ProtectWallet',
}
