export enum KeylessBackupFlow {
  Setup = 'setup',
  Restore = 'restore',
}

export enum KeylessBackupStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  RestoreZeroBalance = 'RestoreZeroBalance',
  Completed = 'Completed',
  Failed = 'Failed',
}
