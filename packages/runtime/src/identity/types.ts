export enum RecipientVerificationStatus {
  UNVERIFIED = 0,
  VERIFIED = 1,
  UNKNOWN = 2,
}

export enum ImportContactsStatus {
  Failed = -1,
  Stopped = 0,
  Prepping = 1,
  Importing = 2,
  Processing = 3,
  Done = 5,
}
