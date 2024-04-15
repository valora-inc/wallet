import { PincodeType } from 'src/account/reducer'

export enum Actions {
  CHOOSE_CREATE_ACCOUNT = 'ACCOUNT/CHOOSE_CREATE',
  CHOOSE_RESTORE_ACCOUNT = 'ACCOUNT/CHOOSE_RESTORE',
  START_STORE_WIPE_RECOVERY = 'ACCOUNT/START_STORE_WIPE_RECOVERY',
  CANCEL_CREATE_OR_RESTORE_ACCOUNT = 'ACCOUNT/CANCEL_CREATE_OR_RESTORE_ACCOUNT',
  SET_NAME = 'ACCOUNT/SET_NAME',
  SET_PHONE_NUMBER = 'ACCOUNT/SET_PHONE_NUMBER',
  SET_PICTURE = 'ACCOUNT/SET_PICTURE',
  SAVE_NAME_AND_PICTURE = 'ACCOUNT/SAVE_NAME_AND_PICTURE',
  DEV_MODE_TRIGGER_CLICKED = 'ACCOUNT/NAME_CLICKED',
  PHOTOSNUX_CLICKED = 'ACCOUNT/PHOTOSNUX_CLICKED',
  SET_PINCODE_SUCCESS = 'ACCOUNT/SET_PINCODE_SUCCESS',
  SET_PINCODE_FAILURE = 'ACCOUNT/SET_PINCODE_FAILURE',
  SET_ACCOUNT_CREATION_TIME = 'ACCOUNT/SET_ACCOUNT_CREATION_TIME',
  INITIALIZE_ACCOUNT = 'ACCOUNT/INITIALIZE_ACCOUNT',
  INITIALIZE_ACCOUNT_SUCCESS = 'ACCOUNT/INITIALIZE_ACCOUNT_SUCCESS',
  INITIALIZE_ACCOUNT_FAILURE = 'ACCOUNT/INITIALIZE_ACCOUNT_FAILURE',
  SET_BACKUP_COMPLETED = 'ACCOUNT/SET_BACKUP_COMPLETED',
  TOGGLE_BACKUP_STATE = 'ACCOUNT/TOGGLE_BACKUP_STATE',
  DISMISS_GET_VERIFIED = 'ACCOUNT/DISMISS_GET_VERIFIED',
  DISMISS_GOLD_EDUCATION = 'ACCOUNT/DISMISS_GOLD_EDUCATION',
  SET_USER_CONTACT_DETAILS = 'ACCOUNT/SET_USER_CONTACT_DETAILS',
  ACCEPT_TERMS = 'ACCOUNT/ACCEPT_TERMS',
  CLEAR_STORED_ACCOUNT = 'ACCOUNT/CLEAR_STORED_ACCOUNT',
  PROFILE_UPLOADED = 'ACCOUNT/PROFILE_UPLOADED',
  SET_REWARDS_ENABLED = 'ACCOUNT/SET_REWARDS_ENABLED',
  DISMISS_KEEP_SUPERCHARGING = 'ACCOUNT/DISMISS_KEEP_SUPERCHARGING',
  DISMISS_START_SUPERCHARGING = 'ACCOUNT/DISMISS_START_SUPERCHARGING',
  SAVE_SIGNED_MESSAGE = 'ACCOUNT/SAVE_SIGNED_MESSAGE',
  SET_CELO_EDUCATION_COMPLETED = 'ACCOUNT/SET_CELO_EDUCATION_COMPLETED',
  RECOVERY_PHRASE_IN_ONBOARDING_STARTED = 'ACCOUNT/RECOVERY_PHRASE_IN_ONBOARDING_STARTED',
  RECOVERY_PHRASE_IN_ONBOARDING_COMPLETED = 'ACCOUNT/RECOVERY_PHRASE_IN_ONBOARDING_COMPLETED',
}

export interface ChooseCreateAccountAction {
  type: Actions.CHOOSE_CREATE_ACCOUNT
  now: number
}
interface ChooseRestoreAccountAction {
  type: Actions.CHOOSE_RESTORE_ACCOUNT
}

interface StartStoreWipeRecoveryAction {
  type: Actions.START_STORE_WIPE_RECOVERY
  accountToRecover: string
}

interface CancelCreateOrRestoreAccountAction {
  type: Actions.CANCEL_CREATE_OR_RESTORE_ACCOUNT
}

interface SetNameAction {
  type: Actions.SET_NAME
  name: string
}

interface SetPhoneNumberAction {
  type: Actions.SET_PHONE_NUMBER
  e164PhoneNumber: string
  countryCode: string
}

interface SetPictureAction {
  type: Actions.SET_PICTURE
  pictureUri: string | null
}

interface SaveNameAndPictureAction {
  type: Actions.SAVE_NAME_AND_PICTURE
  name: string
  pictureUri: string | null
}
interface DevModeTriggerClickedAction {
  type: Actions.DEV_MODE_TRIGGER_CLICKED
}

interface AcceptTermsAction {
  type: Actions.ACCEPT_TERMS
}

interface PhotosNUXClickedAction {
  type: Actions.PHOTOSNUX_CLICKED
}

interface SetPincodeSuccessAction {
  type: Actions.SET_PINCODE_SUCCESS
  pincodeType: PincodeType
}

interface SetPincodeFailureAction {
  type: Actions.SET_PINCODE_FAILURE
}

interface InitializeAccountAction {
  type: Actions.INITIALIZE_ACCOUNT
}

interface InitializeAccountSuccessAction {
  type: Actions.INITIALIZE_ACCOUNT_SUCCESS
}

interface SetAccountCreationAction {
  type: Actions.SET_ACCOUNT_CREATION_TIME
  now: number
}

interface SetBackupCompletedAction {
  type: Actions.SET_BACKUP_COMPLETED
}

interface ToggleBackupState {
  type: Actions.TOGGLE_BACKUP_STATE
}

interface DismissGetVerifiedAction {
  type: Actions.DISMISS_GET_VERIFIED
}

interface DismissGoldEducationAction {
  type: Actions.DISMISS_GOLD_EDUCATION
}

interface SetContactDetailsAction {
  type: Actions.SET_USER_CONTACT_DETAILS
  contactId: string
  thumbnailPath: string | null
}

export interface ClearStoredAccountAction {
  type: Actions.CLEAR_STORED_ACCOUNT
  account: string
  onlyReduxState: boolean
}

interface ProfileUploadedAction {
  type: Actions.PROFILE_UPLOADED
}

interface DismissKeepSuperchargingAction {
  type: Actions.DISMISS_KEEP_SUPERCHARGING
}

interface DismissStartSuperchargingAction {
  type: Actions.DISMISS_START_SUPERCHARGING
}

interface SaveSignedMessage {
  type: Actions.SAVE_SIGNED_MESSAGE
}

interface SetCeloEducationCompletedAction {
  type: Actions.SET_CELO_EDUCATION_COMPLETED
  celoEducationCompleted: boolean
}

interface RecoveryPhraseInOnboardingStarted {
  type: Actions.RECOVERY_PHRASE_IN_ONBOARDING_STARTED
}

interface RecoveryPhraseInOnboardingCompleted {
  type: Actions.RECOVERY_PHRASE_IN_ONBOARDING_COMPLETED
}

export type ActionTypes =
  | ChooseCreateAccountAction
  | ChooseRestoreAccountAction
  | StartStoreWipeRecoveryAction
  | CancelCreateOrRestoreAccountAction
  | SetNameAction
  | SetPhoneNumberAction
  | SetPictureAction
  | SaveNameAndPictureAction
  | DevModeTriggerClickedAction
  | PhotosNUXClickedAction
  | SetPincodeSuccessAction
  | SetPincodeFailureAction
  | InitializeAccountAction
  | InitializeAccountSuccessAction
  | SetAccountCreationAction
  | SetBackupCompletedAction
  | ToggleBackupState
  | DismissGetVerifiedAction
  | DismissGoldEducationAction
  | SetContactDetailsAction
  | AcceptTermsAction
  | ClearStoredAccountAction
  | ProfileUploadedAction
  | DismissKeepSuperchargingAction
  | DismissStartSuperchargingAction
  | SaveSignedMessage
  | SetCeloEducationCompletedAction
  | RecoveryPhraseInOnboardingStarted
  | RecoveryPhraseInOnboardingCompleted

export function chooseCreateAccount(now: number): ChooseCreateAccountAction {
  return {
    type: Actions.CHOOSE_CREATE_ACCOUNT,
    now,
  }
}

export function chooseRestoreAccount(): ChooseRestoreAccountAction {
  return {
    type: Actions.CHOOSE_RESTORE_ACCOUNT,
  }
}

export function startStoreWipeRecovery(accountToRecover: string): StartStoreWipeRecoveryAction {
  return {
    type: Actions.START_STORE_WIPE_RECOVERY,
    accountToRecover,
  }
}

export function cancelCreateOrRestoreAccount(): CancelCreateOrRestoreAccountAction {
  return {
    type: Actions.CANCEL_CREATE_OR_RESTORE_ACCOUNT,
  }
}

export function acceptTerms(): AcceptTermsAction {
  return {
    type: Actions.ACCEPT_TERMS,
  }
}

export function saveNameAndPicture(
  name: string,
  pictureUri: string | null
): SaveNameAndPictureAction {
  return {
    type: Actions.SAVE_NAME_AND_PICTURE,
    name,
    pictureUri,
  }
}

export const devModeTriggerClicked = (): DevModeTriggerClickedAction => ({
  type: Actions.DEV_MODE_TRIGGER_CLICKED,
})

export const setPincodeSuccess = (pincodeType: PincodeType): SetPincodeSuccessAction => ({
  type: Actions.SET_PINCODE_SUCCESS,
  pincodeType,
})

export const initializeAccount = (): InitializeAccountAction => ({
  type: Actions.INITIALIZE_ACCOUNT,
})

export const initializeAccountSuccess = (): InitializeAccountSuccessAction => ({
  type: Actions.INITIALIZE_ACCOUNT_SUCCESS,
})

export const setAccountCreationTime = (now: number): SetAccountCreationAction => ({
  type: Actions.SET_ACCOUNT_CREATION_TIME,
  now,
})

export const setBackupCompleted = (): SetBackupCompletedAction => ({
  type: Actions.SET_BACKUP_COMPLETED,
})

export const toggleBackupState = (): ToggleBackupState => ({
  type: Actions.TOGGLE_BACKUP_STATE,
})

export const dismissGetVerified = (): DismissGetVerifiedAction => ({
  type: Actions.DISMISS_GET_VERIFIED,
})

export const dismissGoldEducation = (): DismissGoldEducationAction => ({
  type: Actions.DISMISS_GOLD_EDUCATION,
})

export const setUserContactDetails = (
  contactId: string,
  thumbnailPath: string | null
): SetContactDetailsAction => ({
  type: Actions.SET_USER_CONTACT_DETAILS,
  contactId,
  thumbnailPath,
})

export const clearStoredAccount = (
  account: string,
  onlyReduxState: boolean = false
): ClearStoredAccountAction => ({
  type: Actions.CLEAR_STORED_ACCOUNT,
  account,
  onlyReduxState,
})

export const dismissKeepSupercharging = (): DismissKeepSuperchargingAction => ({
  type: Actions.DISMISS_KEEP_SUPERCHARGING,
})

export const dismissStartSupercharging = (): DismissStartSuperchargingAction => ({
  type: Actions.DISMISS_START_SUPERCHARGING,
})

export const saveSignedMessage = (): SaveSignedMessage => ({
  type: Actions.SAVE_SIGNED_MESSAGE,
})

export const setGoldEducationCompleted = (): SetCeloEducationCompletedAction => ({
  type: Actions.SET_CELO_EDUCATION_COMPLETED,
  celoEducationCompleted: true,
})

export const recoveryPhraseInOnboardingStarted = (): RecoveryPhraseInOnboardingStarted => ({
  type: Actions.RECOVERY_PHRASE_IN_ONBOARDING_STARTED,
})

export const recoveryPhraseInOnboardingCompleted = (): RecoveryPhraseInOnboardingCompleted => ({
  type: Actions.RECOVERY_PHRASE_IN_ONBOARDING_COMPLETED,
})
