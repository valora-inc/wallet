export enum FiatType {
  USD = 'USD',
  EUR = 'EUR',
}

export enum CryptoType {
  cUSD = 'cUSD',
  cEUR = 'cEUR',
  CELO = 'CELO',
}

export enum KycSchema {
  NameAndAddress = 'NameAndAddress', // NOTE: this is a MOCK schema (not a real one in the spec!)
}

export interface NameAndAddressKYCSchema {
  // NOTE: this is a MOCK schema (not a real one in the spec!)
  firstName: string
  lastName: string
  address: PostalAddress
}

export interface PostalAddress {
  address1: string
  address2?: string
  city: string
  region: string // in the US this means state
  postalCode: string
  isoCountryCode: string
}

export enum FeeType {
  KYCFee = 'KYCFee',
  PlatformFee = 'PlatformFee',
}

export enum FeeFrequency {
  OneTime = 'OneTime',
  Recurring = 'Recurring',
}

export enum FiatAccountType {
  CheckingAccount = 'CheckingAccount',
  DebitCard = 'DebitCard',
  CreditCard = 'CreditCard',
}

export enum FiatAccountSchema {
  CheckingAccount = 'CheckingAccount', // NOTE: this is a MOCK schema (not a real one in the spec!)
}

export interface CheckingAccountSchema {
  // NOTE: this is a MOCK schema (not a real one in the spec!)
  bankName: string
  accountName: string
  fiatType: FiatType
  accountNumber: string
  routingNumber: string
}

export enum TransferType {
  TransferIn = 'TransferIn',
  TransferOut = 'TransferOut',
}

export enum TransferStatus {
  TransferStarted = 'TransferStarted',
  TransferPending = 'TransferPending',
  TransferComplete = 'TransferComplete',
  TransferFailed = 'TransferFailed',
}

export enum WebhookEventType {
  // NOTE: if we use these we should update the spec (which has 'webhook' prefix for all of these)
  KYCStatusEvent = 'KYCStatusEvent',
  TransferInStatusEvent = 'TransferInStatusEvent',
  TransferOutStatusEvent = 'TransferOutStatusEvent',
}

export enum FCError {
  GeoNotSupported = 'GeoNotSupported',
  CryptoAmountTooLow = 'CryptoAmountTooLow',
  CryptoAmountTooHigh = 'CryptoAmountTooHigh',
  FiatAmountTooLow = 'FiatAmountTooLow',
  FiatAmountTooHigh = 'FiatAmountTooHigh',
  CryptoNotSupported = 'CryptoNotSupported',
  FiatNotSupported = 'FiatNotSupported',
  UnsupportedSchema = 'UnsupportedSchema',
  InvalidSchema = 'InvalidSchema',
  ResourceExists = 'ResourceExists',
  ResourceNotFound = 'ResourceNotFound',
  TransferNotAllowed = 'TransferNotAllowed',
  KYCExpired = 'KYCExpired',
}
