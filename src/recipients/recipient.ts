import { parsePhoneNumber } from '@celo/phone-utils'
import * as fuzzysort from 'fuzzysort'
import { TFunction } from 'i18next'
import { MinimalContact } from 'react-native-contacts'
import { formatShortenedAddress } from 'src/components/ShortenedAddress'
import {
  AddressToDisplayNameType,
  AddressToE164NumberType,
  AddressToVerificationStatus,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { RecipientVerificationStatus } from 'src/identity/types'
import Logger from 'src/utils/Logger'

const TAG = 'recipients/recipient'

export type Recipient = {
  name?: string | null
  contactId?: string // unique ID given by phone OS
  thumbnailPath?: string
  displayNumber?: string
  e164PhoneNumber?: string
  address?: string
  recipientType: RecipientType
} & ({ e164PhoneNumber: string } | { address: string })

export type MobileRecipient = Recipient & {
  e164PhoneNumber: string
}

// contacts pulled from the phone
export type ContactRecipient = MobileRecipient & {
  name: string
  contactId: string
}

export type AddressRecipient = Recipient & {
  address: string
  recipientType: RecipientType.Address
}

export enum RecipientType {
  Address = 'Address',
  PhoneNumber = 'PhoneNumber',
  Nomspace = 'Nomspace',
  Merchant = 'Merchant',
}

export function recipientHasNumber(recipient: Recipient): recipient is MobileRecipient {
  return recipient && 'e164PhoneNumber' in recipient && !!recipient.e164PhoneNumber
}

function recipientHasAddress(recipient: Recipient): recipient is AddressRecipient {
  return recipient && 'address' in recipient && !!recipient.address
}

export function getDisplayName(recipient: Recipient, t: TFunction) {
  if (recipient.name) {
    return recipient.name
  } else if (recipient.displayNumber) {
    return recipient.displayNumber
  } else if (recipient.e164PhoneNumber) {
    return recipient.e164PhoneNumber
  } else if (recipient.address) {
    return t('feedItemAddress', { address: formatShortenedAddress(recipient.address) })
  } else {
    return t('unknown')
  }
}

export function getDisplayDetail(recipient: Recipient) {
  if (recipientHasNumber(recipient)) {
    return recipient.displayNumber || recipient.e164PhoneNumber
  } else {
    return recipient.address.substring(2, 17) + '...'
  }
}

export interface NumberToRecipient {
  [number: string]: ContactRecipient
}

export interface AddressToRecipient {
  [address: string]: AddressRecipient
}

/**
 * Transforms contacts into a map of e164Number to recipients based on phone numbers from contacts.
 * If a contact has no phone numbers it won't result in any recipients.
 */
export function contactsToRecipients(contacts: MinimalContact[], defaultCountryCode: string) {
  try {
    //  We need a map of e164Number to recipients so we can efficiently
    //    update them later as the latest contact mappings arrive from the contact calls.

    const e164NumberToRecipients: NumberToRecipient = {}
    for (const contact of contacts) {
      if (!contact.phoneNumbers || !contact.phoneNumbers.length) {
        // Skip contacts without phone numbers
        continue
      }

      for (const phoneNumber of contact.phoneNumbers) {
        const parsedNumber = parsePhoneNumber(phoneNumber.number, defaultCountryCode)

        if (parsedNumber) {
          if (e164NumberToRecipients[parsedNumber.e164Number]) {
            // Skip duplicate phone numbers
            continue
          }
          e164NumberToRecipients[parsedNumber.e164Number] = {
            name: contact.displayName,
            // We intentionally use phoneNumber.number rather than parsedNumber.displayNumber.
            displayNumber: phoneNumber.number,
            e164PhoneNumber: parsedNumber.e164Number,
            // @ts-ignore TODO Minimal contact type is incorrect, on android it returns id
            contactId: contact.recordID || contact.id,
            // we are no longer using local contact pictures
            recipientType: RecipientType.PhoneNumber,
          }
        } else {
          // don't do anything for contacts without e164PhoneNumber, as we can't interact with them anyways
        }
      }
    }
    return e164NumberToRecipients
  } catch (error) {
    Logger.error(TAG, 'Failed to build recipients cache', error)
    throw error
  }
}

export interface RecipientInfo {
  addressToE164Number: AddressToE164NumberType
  phoneRecipientCache: NumberToRecipient
  valoraRecipientCache: AddressToRecipient
  // this info comes from Firebase for known addresses (ex. Simplex, cUSD incentive programs)
  // differentiated from valoraRecipients because they are not displayed in the RecipientPicker
  addressToDisplayName: AddressToDisplayNameType
}

export function getRecipientFromAddress(
  address: string,
  info: RecipientInfo,
  defaultName?: string | null,
  defaultImage?: string | null
): Recipient {
  const e164PhoneNumber = info.addressToE164Number[address]
  const numberRecipient = e164PhoneNumber ? info.phoneRecipientCache[e164PhoneNumber] : undefined
  const valoraRecipient = info.valoraRecipientCache[address]
  const displayInfo = info.addressToDisplayName[address]

  const recipient: Recipient = {
    address,
    name:
      valoraRecipient?.name ||
      numberRecipient?.name ||
      displayInfo?.name ||
      defaultName ||
      undefined,
    thumbnailPath:
      valoraRecipient?.thumbnailPath || displayInfo?.imageUrl || defaultImage || undefined,
    contactId: valoraRecipient?.contactId || numberRecipient?.contactId,
    e164PhoneNumber: e164PhoneNumber || undefined,
    displayNumber: numberRecipient?.displayNumber,
    recipientType: RecipientType.Address,
  }

  return recipient
}

export function getRecipientVerificationStatus(
  recipient: Recipient,
  e164NumberToAddress: E164NumberToAddressType,
  addressToVerificationStatus: AddressToVerificationStatus
): RecipientVerificationStatus {
  // phone recipients should always have a number, the extra check is to ensure typing
  if (recipient.recipientType === RecipientType.PhoneNumber && recipientHasNumber(recipient)) {
    const addresses = e164NumberToAddress[recipient.e164PhoneNumber]
    if (addresses === undefined) {
      return RecipientVerificationStatus.UNKNOWN
    }

    if (addresses === null) {
      return RecipientVerificationStatus.UNVERIFIED
    }

    return RecipientVerificationStatus.VERIFIED
  }
  if (recipientHasAddress(recipient) && recipient.address in addressToVerificationStatus) {
    switch (addressToVerificationStatus[recipient.address]) {
      case true:
        return RecipientVerificationStatus.VERIFIED
      case false:
        return RecipientVerificationStatus.UNVERIFIED
      case undefined:
        return RecipientVerificationStatus.UNKNOWN
    }
  } else {
    return RecipientVerificationStatus.UNKNOWN
  }
}

type PreparedRecipient = Recipient & {
  displayPrepared: Fuzzysort.Prepared | undefined
  phonePrepared: Fuzzysort.Prepared | undefined
}

type FuzzyRecipient = Recipient | PreparedRecipient

const SCORE_THRESHOLD = -6000

const fuzzysortOptions = {
  keys: ['displayName', 'e164PhoneNumber', 'address'],
  threshold: SCORE_THRESHOLD,
  allowTypo: false,
}

const fuzzysortPreparedOptions = {
  keys: ['displayPrepared', 'phonePrepared', 'addressPrepared'],
  threshold: SCORE_THRESHOLD,
  allowTypo: false,
}

function fuzzysortToRecipients(
  fuzzyResults: Fuzzysort.KeysResults<FuzzyRecipient>
): FuzzyRecipient[] {
  // This is the fastest way to map the 'obj' into a results array
  // https://jsperf.com/set-iterator-vs-foreach/16
  const result = []
  for (let _len = fuzzyResults.length, _key = 0; _key < _len; _key++) {
    result[_key] = fuzzyResults[_key].obj
  }
  return result
}

function nameCompare(a: FuzzyRecipient, b: FuzzyRecipient) {
  const nameA = a.name?.toUpperCase() ?? ''
  const nameB = b.name?.toUpperCase() ?? ''

  if (nameA > nameB) {
    return 1
  } else if (nameA < nameB) {
    return -1
  }
  return 0
}

export function sortRecipients(recipients: Recipient[]) {
  return recipients.sort(nameCompare)
}

function executeFuzzySearch(
  recipients: FuzzyRecipient[],
  query: string,
  options: Fuzzysort.KeysOptions<FuzzyRecipient>,
  shouldSort?: boolean
): FuzzyRecipient[] {
  const parsedQuery = query.replace(/[()-\s/\\]/g, '')
  if (parsedQuery === '') {
    // fuzzysort does not handle empty string query
    if (shouldSort) {
      return sortRecipients(recipients)
    } else {
      return recipients
    }
  }

  return fuzzysortToRecipients(fuzzysort.go(parsedQuery, recipients, options))
}

export function filterRecipients(recipients: Recipient[], query: string, shouldSort?: boolean) {
  return executeFuzzySearch(recipients, query, fuzzysortOptions, shouldSort)
}

export function filterRecipientFactory(recipients: Recipient[], shouldSort: boolean) {
  const preparedRecipients = recipients.map((r) => ({
    ...r,
    displayPrepared: fuzzysort.prepare(r.name!),
    phonePrepared: recipientHasNumber(r) ? fuzzysort.prepare(r.e164PhoneNumber) : undefined,
    addressPrepared: recipientHasAddress(r) ? fuzzysort.prepare(r.address) : undefined,
  }))

  return (query: string) => {
    return executeFuzzySearch(preparedRecipients, query, fuzzysortPreparedOptions, shouldSort)
  }
}

// Returns true if two recipients are equivalent
// This isn't trivial because two recipients of diff types (Qr code vs contact)
// could potentially refer to the same recipient
export function areRecipientsEquivalent(recipient1: Recipient, recipient2: Recipient) {
  if (recipient1 === recipient2) {
    return true
  }

  if (
    recipientHasNumber(recipient1) &&
    recipientHasNumber(recipient2) &&
    recipient1.e164PhoneNumber === recipient2.e164PhoneNumber
  ) {
    return true
  }

  if (
    recipientHasAddress(recipient1) &&
    recipientHasAddress(recipient2) &&
    recipient1.address === recipient2.address
  ) {
    return true
  }

  // Todo(Rossy) there's still the case where one recip's e164Number gets resolved to another's address
  // but to detect that we'll need to wire in the mappings and check there too

  return false
}
