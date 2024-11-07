export enum AdventureCardName {
  Add = 'add',
  Profile = 'profile',
  LearnPoints = 'learnPoints',
  Earn = 'earn',
}

export enum ToggleableOnboardingFeatures {
  // Shows Cloud Backup as a restore option in onboarding AND in the settings screen
  CloudBackupRestore = 'CloudBackupRestore',
  // Shows Cloud Backup as a setup option in onboarding ONLY if CloudBackupRestore is true
  CloudBackupSetupInOnboarding = 'CloudBackupSetupInOnboarding',
  // Whether or not CPV is shown in onboarding
  PhoneVerification = 'PhoneVerification',
  // Whether the Biometry screen is shown directly after PincodeSet screen in onboarding
  EnableBiometry = 'EnableBiometry',
  // Shows the ProtectWallet screen in onboarding if at least one of CloudBackupRestore or
  // CloudBackupSetupInOnboarding is false
  ProtectWallet = 'ProtectWallet',
}
