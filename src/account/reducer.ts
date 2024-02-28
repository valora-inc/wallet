import { isE164NumberStrict } from '@celo/phone-utils'
import { Actions, ActionTypes } from 'src/account/actions'
import { Actions as AppActions, ActionTypes as AppActionTypes } from 'src/app/actions'
import { DEV_SETTINGS_ACTIVE_INITIALLY } from 'src/config'
import { deleteKeylessBackupCompleted, keylessBackupCompleted } from 'src/keylessBackup/slice'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import Logger from 'src/utils/Logger'
import { Actions as Web3Actions, ActionTypes as Web3ActionTypes } from 'src/web3/actions'

export interface State {
  name: string | null
  e164PhoneNumber: string | null
  pictureUri: string | null
  defaultCountryCode: string | null
  contactDetails: UserContactDetails
  devModeActive: boolean
  devModeClickCount: number
  photosNUXClicked: boolean
  pincodeType: PincodeType
  backupCompleted: boolean // recovery phrase backup
  accountCreationTime: number
  startOnboardingTime?: number
  dismissedGetVerified: boolean
  dismissedGoldEducation: boolean
  acceptedTerms: boolean
  hasMigratedToNewBip39: boolean
  choseToRestoreAccount?: boolean
  profileUploaded?: boolean
  recoveringFromStoreWipe?: boolean
  accountToRecoverFromStoreWipe?: string
  dismissedKeepSupercharging: boolean
  dismissedStartSupercharging: boolean
  celoEducationCompleted: boolean
  recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus
  cloudBackupCompleted: boolean
}

export enum PincodeType {
  Unset = 'Unset',
  CustomPin = 'CustomPin',
  PhoneAuth = 'PhoneAuth',
}

export interface UserContactDetails {
  contactId: string | null
  thumbnailPath: string | null
}

export enum KycStatus {
  Created = 'created',
  Completed = 'completed',
  Failed = 'failed',
  Pending = 'pending',
  Expired = 'expired',
  Approved = 'approved',
  Declined = 'declined',
  NeedsReview = 'needs-review',
  NotCreated = 'not-created',
}

// Maintaining this as it's required for migrations
export enum FinclusiveKycStatus {
  NotSubmitted = 0,
  Submitted = 1,
  Accepted = 2,
  Rejected = 3,
  InReview = 4,
}

export enum RecoveryPhraseInOnboardingStatus {
  NotStarted = 'NotStarted', // users who have not reached the "ProtectWallet" screen
  InProgress = 'InProgress', // users who have reached the "ProtectWallet" screen, but not clicked "I've saved it"
  Completed = 'Completed', // users who have clicked "I've saved it"
}

export const initialState: State = {
  name: null,
  e164PhoneNumber: null,
  pictureUri: null,
  defaultCountryCode: null,
  contactDetails: {
    contactId: null,
    thumbnailPath: null,
  },
  devModeActive: DEV_SETTINGS_ACTIVE_INITIALLY,
  devModeClickCount: 0,
  photosNUXClicked: false,
  pincodeType: PincodeType.Unset,
  accountCreationTime: 99999999999999,
  startOnboardingTime: undefined,
  backupCompleted: false,
  dismissedGetVerified: false,
  dismissedGoldEducation: false,
  acceptedTerms: false,
  hasMigratedToNewBip39: false,
  choseToRestoreAccount: false,
  profileUploaded: false,
  recoveringFromStoreWipe: false,
  accountToRecoverFromStoreWipe: undefined,
  dismissedKeepSupercharging: false,
  dismissedStartSupercharging: false,
  celoEducationCompleted: false,
  recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus.NotStarted,
  cloudBackupCompleted: false,
}

export const reducer = (
  state: State | undefined = initialState,
  action:
    | ActionTypes
    | RehydrateAction
    | Web3ActionTypes
    | AppActionTypes
    | typeof keylessBackupCompleted
    | typeof deleteKeylessBackupCompleted
): State => {
  switch (action.type) {
    case REHYDRATE: {
      const rehydratedPayload = getRehydratePayload(action, 'account')
      // Ignore some persisted properties
      return {
        ...state,
        ...rehydratedPayload,
        dismissedGetVerified: false,
      }
    }
    case Actions.CHOOSE_CREATE_ACCOUNT:
      return {
        ...state,
        choseToRestoreAccount: false,
        startOnboardingTime: state?.startOnboardingTime ?? action.now,
      }
    case Actions.CHOOSE_RESTORE_ACCOUNT:
      return {
        ...state,
        choseToRestoreAccount: true,
      }
    case Actions.START_STORE_WIPE_RECOVERY:
      return {
        ...state,
        choseToRestoreAccount: true,
        recoveringFromStoreWipe: true,
        accountToRecoverFromStoreWipe: action.accountToRecover,
        pincodeType: PincodeType.CustomPin,
        acceptedTerms: true,
      }
    case Actions.CANCEL_CREATE_OR_RESTORE_ACCOUNT:
      return {
        ...state,
        choseToRestoreAccount: false,
        recoveringFromStoreWipe: false,
        pincodeType: PincodeType.Unset,
      }
    case Actions.SET_NAME:
      return {
        ...state,
        name: action.name,
      }
    case Actions.SET_PICTURE:
      return {
        ...state,
        pictureUri: action.pictureUri,
      }
    case Actions.SAVE_NAME_AND_PICTURE:
      return {
        ...state,
        name: action.name,
        pictureUri: action.pictureUri,
      }
    case AppActions.PHONE_NUMBER_VERIFICATION_COMPLETED:
    case Actions.SET_PHONE_NUMBER:
      if (!isE164NumberStrict(action.e164PhoneNumber)) {
        return state
      }
      return {
        ...state,
        e164PhoneNumber: action.e164PhoneNumber,
        defaultCountryCode: action.countryCode,
      }
    case AppActions.PHONE_NUMBER_REVOKED:
      return {
        ...state,
        e164PhoneNumber: null,
        defaultCountryCode: null,
      }
    case Actions.DEV_MODE_TRIGGER_CLICKED:
      const newClickCount = (state.devModeClickCount + 1) % 10
      if (newClickCount === 5) {
        Logger.showMessage('Debug Mode Activated')
      } else if (newClickCount === 0) {
        Logger.showMessage('Debug Mode Deactivated')
      }
      return {
        ...state,
        devModeClickCount: newClickCount,
        devModeActive: newClickCount >= 5,
      }
    case Actions.PHOTOSNUX_CLICKED:
      return {
        ...state,
        photosNUXClicked: true,
      }
    case Actions.SET_PINCODE_SUCCESS:
      return {
        ...state,
        pincodeType: action.pincodeType,
      }
    case Actions.SET_PINCODE_FAILURE:
      return {
        ...state,
        pincodeType: PincodeType.Unset,
      }
    case Actions.SET_ACCOUNT_CREATION_TIME:
      return {
        ...state,
        accountCreationTime: action.now,
      }
    case Actions.SET_BACKUP_COMPLETED:
      return {
        ...state,
        backupCompleted: true,
      }
    case Actions.TOGGLE_BACKUP_STATE:
      return {
        ...state,
        backupCompleted: !state.backupCompleted,
      }
    case Actions.DISMISS_GET_VERIFIED:
      return {
        ...state,
        dismissedGetVerified: true,
      }
    case Actions.DISMISS_GOLD_EDUCATION:
      return {
        ...state,
        dismissedGoldEducation: true,
      }
    case Actions.SET_USER_CONTACT_DETAILS:
      return {
        ...state,
        contactDetails: {
          contactId: action.contactId,
          thumbnailPath: action.thumbnailPath,
        },
      }
    case Actions.ACCEPT_TERMS: {
      return { ...state, acceptedTerms: true }
    }
    case Web3Actions.SET_ACCOUNT: {
      return {
        ...state,
        hasMigratedToNewBip39: true,
      }
    }
    case Actions.PROFILE_UPLOADED: {
      return {
        ...state,
        profileUploaded: true,
      }
    }
    case Actions.DISMISS_KEEP_SUPERCHARGING:
      return {
        ...state,
        dismissedKeepSupercharging: true,
      }
    case Actions.DISMISS_START_SUPERCHARGING:
      return {
        ...state,
        dismissedStartSupercharging: true,
      }
    case Actions.SET_CELO_EDUCATION_COMPLETED:
      return {
        ...state,
        celoEducationCompleted: action.celoEducationCompleted,
      }
    case Actions.RECOVERY_PHRASE_IN_ONBOARDING_STARTED:
      return {
        ...state,
        recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus.InProgress,
      }
    case Actions.RECOVERY_PHRASE_IN_ONBOARDING_COMPLETED:
      return {
        ...state,
        recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus.Completed,
      }
    case keylessBackupCompleted.type:
      return {
        ...state,
        cloudBackupCompleted: true,
      }
    case deleteKeylessBackupCompleted.type:
      return {
        ...state,
        cloudBackupCompleted: false,
      }
    default:
      return state
  }
}
