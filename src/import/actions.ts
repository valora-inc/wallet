import { QrCode } from 'src/send/actions'

export enum Actions {
  IMPORT_BACKUP_PHRASE = 'IMPORT/IMPORT_BACKUP_PHRASE',
  IMPORT_BACKUP_PHRASE_SUCCESS = 'IMPORT/IMPORT_BACKUP_PHRASE_SUCCESS',
  IMPORT_BACKUP_PHRASE_FAILURE = 'IMPORT/IMPORT_BACKUP_PHRASE_FAILURE',
  KEYSHARE_DETECTED = 'CAPSULE/KEYSHARE_DETECTED',
  IMPORT_USER_KEYSHARE = 'CAPSULE/IMPORT_USER_KEYSHARE',
  IMPORT_USER_KEYSHARE_SUCCESS = 'CAPSULE/USER_KEYSHARE_SUCCESS',
  IMPORT_USER_KEYSHARE_FAILURE = 'CAPSULE/USER_KEYSHARE_FAILURE',
  IMPORT_RECOVERY_KEYSHARE = 'CAPSULE/IMPORT_RECOVERY_KEYSHARE',
  IMPORT_RECOVERY_KEYSHARE_SUCCESS = 'CAPSULE/RECOVERY_KEYSHARE_SUCCESS',
  IMPORT_RECOVERY_KEYSHARE_FAILURE = 'CAPSULE/RECOVERY_KEYSHARE_FAILURE',
}

export interface HandleKeyshareDetected {
  type: Actions.KEYSHARE_DETECTED
  data: QrCode
}

export const handleDetectedKeyshare = (data: QrCode): HandleKeyshareDetected => ({
  type: Actions.KEYSHARE_DETECTED,
  data,
})

export interface ImportUserKeyshareSecretAction {
  type: Actions.IMPORT_USER_KEYSHARE
  keyshareSecret: string
}

export const importUserKeyshare = (keyshareSecret: string): ImportUserKeyshareSecretAction => ({
  type: Actions.IMPORT_USER_KEYSHARE,
  keyshareSecret,
})

export interface ImportRecoveryKeyshareAction {
  type: Actions.IMPORT_RECOVERY_KEYSHARE
  keyshare: string
}

export const importRecoveryKeyshare = (keyshare: string): ImportRecoveryKeyshareAction => ({
  type: Actions.IMPORT_RECOVERY_KEYSHARE,
  keyshare,
})

export interface ImportBackupPhraseAction {
  type: Actions.IMPORT_BACKUP_PHRASE
  phrase: string
  useEmptyWallet: boolean
}

export const importBackupPhrase = (
  phrase: string,
  useEmptyWallet: boolean
): ImportBackupPhraseAction => ({
  type: Actions.IMPORT_BACKUP_PHRASE,
  phrase,
  useEmptyWallet,
})

export interface ImportBackupPhraseSuccessAction {
  type: Actions.IMPORT_BACKUP_PHRASE_SUCCESS
}

export const importBackupPhraseSuccess = (): ImportBackupPhraseSuccessAction => ({
  type: Actions.IMPORT_BACKUP_PHRASE_SUCCESS,
})

export interface ImportBackupPhraseFailureAction {
  type: Actions.IMPORT_BACKUP_PHRASE_FAILURE
}

export const importBackupPhraseFailure = (): ImportBackupPhraseFailureAction => ({
  type: Actions.IMPORT_BACKUP_PHRASE_FAILURE,
})

export interface ImportUserKeyshareSuccessAction {
  type: Actions.IMPORT_USER_KEYSHARE_SUCCESS
}

export const importUserKeyshareSuccess = (): ImportUserKeyshareSuccessAction => ({
  type: Actions.IMPORT_USER_KEYSHARE_SUCCESS,
})

export interface ImportUserKeyshareFailureAction {
  type: Actions.IMPORT_USER_KEYSHARE_FAILURE
}

export const importUserKeyshareFailure = (): ImportUserKeyshareFailureAction => ({
  type: Actions.IMPORT_USER_KEYSHARE_FAILURE,
})

export interface ImportRecoveryKeyshareSuccessAction {
  type: Actions.IMPORT_RECOVERY_KEYSHARE_SUCCESS
}

export const importRecoveryKeyshareSuccess = (): ImportRecoveryKeyshareSuccessAction => ({
  type: Actions.IMPORT_RECOVERY_KEYSHARE_SUCCESS,
})

export interface ImportRecoveryKeyshareFailureAction {
  type: Actions.IMPORT_RECOVERY_KEYSHARE_FAILURE
}

export const importRecoveryKeyshareFailure = (): ImportRecoveryKeyshareFailureAction => ({
  type: Actions.IMPORT_RECOVERY_KEYSHARE_FAILURE,
})

export type ActionTypes =
  | ImportBackupPhraseAction
  | ImportBackupPhraseSuccessAction
  | ImportBackupPhraseFailureAction
  | ImportUserKeyshareSuccessAction
  | ImportUserKeyshareFailureAction
  | ImportRecoveryKeyshareAction
  | ImportRecoveryKeyshareSuccessAction
  | ImportRecoveryKeyshareFailureAction
