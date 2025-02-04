export enum KeylessBackupFlow {
  Setup = 'setup',
  Restore = 'restore',
}

export enum KeylessBackupStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  RestoreZeroBalance = 'RestoreZeroBalance', // only in restore flow
  Completed = 'Completed',
  Failed = 'Failed',
  NotFound = 'NotFound', // only in restore flow
}

export enum KeylessBackupDeleteStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Failed = 'Failed',
}

export enum KeylessBackupOrigin {
  Onboarding = 'Onboarding',
  Settings = 'Settings',
}
