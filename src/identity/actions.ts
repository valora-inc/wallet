import { normalizeAddressWith0x } from '@celo/base'
import { E164Number } from '@celo/phone-utils'
import {
  AddressToDisplayNameType,
  AddressToE164NumberType,
  AddressValidationType,
  E164NumberToAddressType,
  E164NumberToSaltType,
  WalletToAccountAddressType,
} from 'src/identity/reducer'
import { ImportContactsStatus } from 'src/identity/types'
import { Recipient } from 'src/recipients/recipient'

export enum Actions {
  SET_SEEN_VERIFICATION_NUX = 'IDENTITY/SET_SEEN_VERIFICATION_NUX',
  UPDATE_E164_PHONE_NUMBER_ADDRESSES = 'IDENTITY/UPDATE_E164_PHONE_NUMBER_ADDRESSES',
  UPDATE_WALLET_TO_ACCOUNT_ADDRESS = 'UPDATE_WALLET_TO_ACCOUNT_ADDRESS',
  UPDATE_E164_PHONE_NUMBER_SALT = 'IDENTITY/UPDATE_E164_PHONE_NUMBER_SALT',
  UPDATE_KNOWN_ADDRESSES = 'IDENTITY/UPDATE_KNOWN_ADDRESSES',
  FETCH_ADDRESSES_AND_VALIDATION_STATUS = 'IDENTITY/FETCH_ADDRESSES_AND_VALIDATION_STATUS',
  END_FETCHING_ADDRESSES = 'IDENTITY/END_FETCHING_ADDRESSES',
  IMPORT_CONTACTS = 'IDENTITY/IMPORT_CONTACTS',
  UPDATE_IMPORT_CONTACT_PROGRESS = 'IDENTITY/UPDATE_IMPORT_CONTACT_PROGRESS',
  CANCEL_IMPORT_CONTACTS = 'IDENTITY/CANCEL_IMPORT_CONTACTS',
  END_IMPORT_CONTACTS = 'IDENTITY/END_IMPORT_CONTACTS',
  DENY_IMPORT_CONTACTS = 'IDENTITY/DENY_IMPORT_CONTACTS',
  VALIDATE_RECIPIENT_ADDRESS = 'IDENTITY/VALIDATE_RECIPIENT_ADDRESS',
  VALIDATE_RECIPIENT_ADDRESS_SUCCESS = 'IDENTITY/VALIDATE_RECIPIENT_ADDRESS_SUCCESS',
  VALIDATE_RECIPIENT_ADDRESS_RESET = 'IDENTITY/VALIDATE_RECIPIENT_ADDRESS_RESET',
  REQUIRE_SECURE_SEND = 'IDENTITY/REQUIRE_SECURE_SEND',
  FETCH_DATA_ENCRYPTION_KEY = 'IDENTITY/FETCH_DATA_ENCRYPTION_KEY',
  UPDATE_ADDRESS_DEK_MAP = 'IDENTITY/UPDATE_ADDRESS_DEK_MAP',
  FETCH_ADDRESS_VERIFICATION_STATUS = 'IDENTITY/FETCH_ADDRESS_VERIFICATION_STATUS',
  ADDRESS_VERIFICATION_STATUS_RECEIVED = 'IDENTITY/ADDRESS_VERIFICATION_STATUS_RECEIVED',
}

export interface SetHasSeenVerificationNux {
  type: Actions.SET_SEEN_VERIFICATION_NUX
  status: boolean
}

export interface UpdateE164PhoneNumberAddressesAction {
  type: Actions.UPDATE_E164_PHONE_NUMBER_ADDRESSES
  e164NumberToAddress: E164NumberToAddressType
  addressToE164Number: AddressToE164NumberType
}

export interface UpdateWalletToAccountAddressAction {
  type: Actions.UPDATE_WALLET_TO_ACCOUNT_ADDRESS
  walletToAccountAddress: WalletToAccountAddressType
}

export interface UpdateE164PhoneNumberSaltAction {
  type: Actions.UPDATE_E164_PHONE_NUMBER_SALT
  e164NumberToSalt: E164NumberToSaltType
}

export interface UpdateKnownAddressesAction {
  type: Actions.UPDATE_KNOWN_ADDRESSES
  knownAddresses: AddressToDisplayNameType
}

export interface FetchAddressesAndValidateAction {
  type: Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS
  e164Number: string
  requesterAddress?: string
}

export interface EndFetchingAddressesAction {
  type: Actions.END_FETCHING_ADDRESSES
  e164Number: string
  lastFetchSuccessful: boolean
}

export interface ImportContactsAction {
  type: Actions.IMPORT_CONTACTS
}

export interface UpdateImportContactProgress {
  type: Actions.UPDATE_IMPORT_CONTACT_PROGRESS
  status?: ImportContactsStatus
  current?: number
  total?: number
}

export interface CancelImportContactsAction {
  type: Actions.CANCEL_IMPORT_CONTACTS
}

export interface EndImportContactsAction {
  type: Actions.END_IMPORT_CONTACTS
  success: boolean
}

export interface DenyImportContactsAction {
  type: Actions.DENY_IMPORT_CONTACTS
}

export interface ValidateRecipientAddressAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS
  userInputOfFullAddressOrLastFourDigits: string
  addressValidationType: AddressValidationType
  recipient: Recipient
  requesterAddress?: string
}

export interface ValidateRecipientAddressSuccessAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS
  e164Number: string
  validatedAddress: string
}

export interface ValidateRecipientAddressResetAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_RESET
  e164Number: string
}

export interface RequireSecureSendAction {
  type: Actions.REQUIRE_SECURE_SEND
  e164Number: E164Number
  addressValidationType: AddressValidationType
}

export interface FetchDataEncryptionKeyAction {
  type: Actions.FETCH_DATA_ENCRYPTION_KEY
  address: string
}

export interface UpdateAddressDekMapAction {
  type: Actions.UPDATE_ADDRESS_DEK_MAP
  address: string
  dataEncryptionKey: string | null
}

export interface FetchAddressVerificationAction {
  type: Actions.FETCH_ADDRESS_VERIFICATION_STATUS
  address: string
}

export interface AddressVerificationStatusReceivedAction {
  type: Actions.ADDRESS_VERIFICATION_STATUS_RECEIVED
  address: string
  addressVerified: boolean
}

export type ActionTypes =
  | SetHasSeenVerificationNux
  | UpdateE164PhoneNumberAddressesAction
  | UpdateWalletToAccountAddressAction
  | UpdateE164PhoneNumberSaltAction
  | UpdateKnownAddressesAction
  | ImportContactsAction
  | UpdateImportContactProgress
  | EndImportContactsAction
  | DenyImportContactsAction
  | ValidateRecipientAddressAction
  | ValidateRecipientAddressSuccessAction
  | ValidateRecipientAddressResetAction
  | RequireSecureSendAction
  | FetchAddressesAndValidateAction
  | EndFetchingAddressesAction
  | FetchDataEncryptionKeyAction
  | UpdateAddressDekMapAction
  | FetchAddressVerificationAction
  | AddressVerificationStatusReceivedAction

export const setHasSeenVerificationNux = (status: boolean): SetHasSeenVerificationNux => ({
  type: Actions.SET_SEEN_VERIFICATION_NUX,
  status,
})

export const fetchAddressesAndValidate = (
  e164Number: string,
  requesterAddress?: string
): FetchAddressesAndValidateAction => ({
  type: Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS,
  e164Number,
  requesterAddress,
})

export const addressVerificationStatusReceived = (
  address: string,
  addressVerified: boolean
): AddressVerificationStatusReceivedAction => ({
  type: Actions.ADDRESS_VERIFICATION_STATUS_RECEIVED,
  address,
  addressVerified,
})

export const fetchAddressVerification = (address: string): FetchAddressVerificationAction => ({
  type: Actions.FETCH_ADDRESS_VERIFICATION_STATUS,
  address,
})

export const endFetchingAddresses = (
  e164Number: string,
  lastFetchSuccessful: boolean
): EndFetchingAddressesAction => ({
  type: Actions.END_FETCHING_ADDRESSES,
  e164Number,
  lastFetchSuccessful,
})

export const updateE164PhoneNumberAddresses = (
  e164NumberToAddress: E164NumberToAddressType,
  addressToE164Number: AddressToE164NumberType
): UpdateE164PhoneNumberAddressesAction => ({
  type: Actions.UPDATE_E164_PHONE_NUMBER_ADDRESSES,
  e164NumberToAddress,
  addressToE164Number,
})

export const updateWalletToAccountAddress = (
  walletToAccountAddress: WalletToAccountAddressType
): UpdateWalletToAccountAddressAction => {
  const newWalletToAccountAddresses: WalletToAccountAddressType = {}
  const walletAddresses = Object.keys(walletToAccountAddress)

  for (const walletAddress of walletAddresses) {
    const newWalletAddress = normalizeAddressWith0x(walletAddress)
    const newAccountAddress = normalizeAddressWith0x(walletToAccountAddress[walletAddress])
    newWalletToAccountAddresses[newWalletAddress] = newAccountAddress
  }

  return {
    type: Actions.UPDATE_WALLET_TO_ACCOUNT_ADDRESS,
    walletToAccountAddress: newWalletToAccountAddresses,
  }
}

export const updateE164PhoneNumberSalts = (
  e164NumberToSalt: E164NumberToSaltType
): UpdateE164PhoneNumberSaltAction => ({
  type: Actions.UPDATE_E164_PHONE_NUMBER_SALT,
  e164NumberToSalt,
})

export const updateKnownAddresses = (
  addresses: AddressToDisplayNameType
): UpdateKnownAddressesAction => ({
  type: Actions.UPDATE_KNOWN_ADDRESSES,
  knownAddresses: addresses,
})

export const importContacts = (): ImportContactsAction => ({
  type: Actions.IMPORT_CONTACTS,
})

export const updateImportContactsProgress = (
  status?: ImportContactsStatus,
  current?: number,
  total?: number
): UpdateImportContactProgress => ({
  type: Actions.UPDATE_IMPORT_CONTACT_PROGRESS,
  status,
  current,
  total,
})

export const cancelImportContacts = (): CancelImportContactsAction => ({
  type: Actions.CANCEL_IMPORT_CONTACTS,
})

export const endImportContacts = (success: boolean): EndImportContactsAction => ({
  type: Actions.END_IMPORT_CONTACTS,
  success,
})

export const denyImportContacts = (): DenyImportContactsAction => ({
  type: Actions.DENY_IMPORT_CONTACTS,
})

export const validateRecipientAddress = (
  userInputOfFullAddressOrLastFourDigits: string,
  addressValidationType: AddressValidationType,
  recipient: Recipient,
  requesterAddress?: string
): ValidateRecipientAddressAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS,
  userInputOfFullAddressOrLastFourDigits,
  addressValidationType,
  recipient,
  requesterAddress,
})

export const validateRecipientAddressSuccess = (
  e164Number: E164Number,
  validatedAddress: string
): ValidateRecipientAddressSuccessAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS,
  e164Number,
  validatedAddress,
})

export const validateRecipientAddressReset = (
  e164Number: E164Number
): ValidateRecipientAddressResetAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_RESET,
  e164Number,
})

export const requireSecureSend = (
  e164Number: E164Number,
  addressValidationType: AddressValidationType
): RequireSecureSendAction => ({
  type: Actions.REQUIRE_SECURE_SEND,
  e164Number,
  addressValidationType,
})

export const fetchDataEncryptionKey = (address: string): FetchDataEncryptionKeyAction => ({
  type: Actions.FETCH_DATA_ENCRYPTION_KEY,
  address,
})

export const updateAddressDekMap = (
  address: string,
  dataEncryptionKey: string | null
): UpdateAddressDekMapAction => ({
  type: Actions.UPDATE_ADDRESS_DEK_MAP,
  address,
  dataEncryptionKey,
})
