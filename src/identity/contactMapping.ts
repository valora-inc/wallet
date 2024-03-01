import { Address } from '@celo/base'
import { AttestationStat, AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { isValidAddress } from '@celo/utils/lib/address'
import { isAccountConsideredVerified } from '@celo/utils/lib/attestations'
import BigNumber from 'bignumber.js'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showErrorOrFallback } from 'src/alert/actions'
import { IdentityEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import {
  Actions,
  FetchAddressVerificationAction,
  FetchAddressesAndValidateAction,
  addressVerificationStatusReceived,
  contactsSaved,
  endFetchingAddresses,
  endImportContacts,
  requireSecureSend,
  updateE164PhoneNumberAddresses,
  updateImportContactsProgress,
} from 'src/identity/actions'
import {
  AddressToE164NumberType,
  AddressValidationType,
  E164NumberToAddressType,
  SecureSendPhoneNumberMapping,
} from 'src/identity/reducer'
import { checkIfValidationRequired } from 'src/identity/secureSend'
import {
  addressToVerificationStatusSelector,
  e164NumberToAddressSelector,
  lastSavedContactsHashSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { ImportContactsStatus } from 'src/identity/types'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { NumberToRecipient, contactsToRecipients } from 'src/recipients/recipient'
import { phoneRecipientCacheSelector, setPhoneRecipientCache } from 'src/recipients/reducer'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { getAllContacts, hasGrantedContactsPermission } from 'src/utils/contacts'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { calculateSha256Hash } from 'src/utils/random'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, delay, put, race, select, spawn, take } from 'typed-redux-saga'

const TAG = 'identity/contactMapping'
export const IMPORT_CONTACTS_TIMEOUT = 1 * 60 * 1000 // 1 minute

export function* doImportContactsWrapper() {
  yield* call(getConnectedAccount)
  try {
    Logger.debug(TAG, 'Importing user contacts')

    const { result, cancel, timeout } = yield* race({
      result: call(doImportContacts),
      cancel: take(Actions.CANCEL_IMPORT_CONTACTS),
      timeout: delay(IMPORT_CONTACTS_TIMEOUT),
    })

    if (result === true) {
      Logger.debug(TAG, 'Import Contacts completed successfully')
    } else if (cancel) {
      Logger.debug(TAG, 'Import Contacts cancelled')
    } else if (timeout) {
      Logger.debug(TAG, 'Import Contacts timed out')
      throw new Error('Import Contacts timed out')
    }

    Logger.debug(TAG, 'Done importing user contacts')
    yield* put(endImportContacts(true))
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, 'Error importing user contacts', error)
    ValoraAnalytics.track(IdentityEvents.contacts_import_error, { error: error.message })
    yield* put(showErrorOrFallback(error, ErrorMessages.IMPORT_CONTACTS_FAILED))
    yield* put(endImportContacts(false))
  }
}

function* doImportContacts() {
  const contactPermissionStatusGranted = yield* call(hasGrantedContactsPermission)
  if (!contactPermissionStatusGranted) {
    Logger.warn(TAG, 'Contact permissions denied. Skipping import.')
    ValoraAnalytics.track(IdentityEvents.contacts_import_permission_denied)
    return true
  }

  ValoraAnalytics.track(IdentityEvents.contacts_import_start)

  SentryTransactionHub.startTransaction(SentryTransaction.import_contacts)
  yield* put(updateImportContactsProgress(ImportContactsStatus.Importing))

  const contacts = yield* call(getAllContacts)
  if (!contacts || !contacts.length) {
    Logger.warn(TAG, 'Empty contacts list. Skipping import.')
    return true
  }
  ValoraAnalytics.track(IdentityEvents.contacts_import_complete, {
    contactImportCount: contacts.length,
  })

  yield* put(updateImportContactsProgress(ImportContactsStatus.Processing, 0, contacts.length))

  const defaultCountryCode = (yield* select(defaultCountryCodeSelector))!
  const e164NumberToRecipients = contactsToRecipients(contacts, defaultCountryCode)
  if (!e164NumberToRecipients) {
    Logger.warn(TAG, 'No recipients found')
    return true
  }

  yield* call(updateUserContact, e164NumberToRecipients)
  Logger.debug(TAG, 'Updating recipients cache')
  yield* put(setPhoneRecipientCache(e164NumberToRecipients))

  ValoraAnalytics.track(IdentityEvents.contacts_processing_complete)
  SentryTransactionHub.finishTransaction(SentryTransaction.import_contacts)

  yield* spawn(saveContacts)

  return true
}

// Find the user's own contact among those imported and save useful bits
function* updateUserContact(e164NumberToRecipients: NumberToRecipient) {
  Logger.debug(TAG, 'Finding user contact details')
  const e164Number = yield* select(e164NumberSelector)

  if (!e164Number) {
    return Logger.warn(TAG, 'User phone number not set, cannot find contact info')
  }

  const userRecipient = e164NumberToRecipients[e164Number]
  if (!userRecipient) {
    return Logger.debug(TAG, 'User contact not found among recipients')
  }

  yield* put(setUserContactDetails(userRecipient.contactId, userRecipient.thumbnailPath || null))
}

export function* fetchAddressesAndValidateSaga({
  e164Number,
  requesterAddress,
}: FetchAddressesAndValidateAction) {
  ValoraAnalytics.track(IdentityEvents.phone_number_lookup_start)
  try {
    Logger.debug(TAG + '@fetchAddressesAndValidate', `Fetching addresses for number`)
    const oldE164NumberToAddress: E164NumberToAddressType = yield* select(
      e164NumberToAddressSelector
    )
    const oldAddresses = oldE164NumberToAddress[e164Number] || []

    // Clear existing entries for those numbers so our mapping consumers know new status is pending.
    yield* put(updateE164PhoneNumberAddresses({ [e164Number]: undefined }, {}))

    const walletAddresses: string[] = yield* call(fetchWalletAddresses, e164Number)

    const e164NumberToAddressUpdates: E164NumberToAddressType = {}
    const addressToE164NumberUpdates: AddressToE164NumberType = {}

    if (!walletAddresses.length) {
      Logger.debug(TAG + '@fetchAddressesAndValidate', `No addresses for number`)
      // Save invalid/0 addresses to avoid checking again
      // null means a contact is unverified, whereas undefined means we haven't checked yet
      e164NumberToAddressUpdates[e164Number] = null
    } else {
      e164NumberToAddressUpdates[e164Number] = walletAddresses
      walletAddresses.map((a) => (addressToE164NumberUpdates[a] = e164Number))
    }

    const userAddress = yield* select(walletAddressSelector)
    if (!userAddress) {
      throw new Error('Wallet address not set')
    }
    const secureSendPossibleAddresses = [...walletAddresses]
    const secureSendPhoneNumberMapping = yield* select(secureSendPhoneNumberMappingSelector)
    // If fetch is being done as part of a payment request from an unverified address,
    // the unverified address should be considered in the Secure Send check
    if (requesterAddress && !secureSendPossibleAddresses.includes(requesterAddress)) {
      secureSendPossibleAddresses.push(requesterAddress)
    }

    const addressValidationType = checkIfValidationRequired(
      oldAddresses,
      secureSendPossibleAddresses,
      userAddress,
      secureSendPhoneNumberMapping,
      e164Number
    )
    if (addressValidationType !== AddressValidationType.NONE) {
      yield* put(requireSecureSend(e164Number, addressValidationType))
    }
    yield* put(
      updateE164PhoneNumberAddresses(e164NumberToAddressUpdates, addressToE164NumberUpdates)
    )
    yield* put(endFetchingAddresses(e164Number, true))
    ValoraAnalytics.track(IdentityEvents.phone_number_lookup_complete)
  } catch (err) {
    const error = ensureError(err)
    Logger.debug(TAG + '@fetchAddressesAndValidate', `Error fetching addresses`, error)
    yield* put(showErrorOrFallback(error, ErrorMessages.ADDRESS_LOOKUP_FAILURE))
    yield* put(endFetchingAddresses(e164Number, false))
    ValoraAnalytics.track(IdentityEvents.phone_number_lookup_error, {
      error: error.message,
    })
  }
}

export function* fetchAddressVerificationSaga({ address }: FetchAddressVerificationAction) {
  try {
    const addressToVerificationStatus = yield* select(addressToVerificationStatusSelector)
    if (!(address in addressToVerificationStatus && addressToVerificationStatus[address])) {
      ValoraAnalytics.track(IdentityEvents.address_lookup_start)
      const addressVerified = yield* call(fetchAddressVerification, address)
      yield* put(addressVerificationStatusReceived(address, addressVerified))
      ValoraAnalytics.track(IdentityEvents.address_lookup_complete)
    }
  } catch (err) {
    const error = ensureError(err)
    Logger.debug(
      TAG + '@fetchAddressVerificationSaga',
      `Error fetching address verification`,
      error
    )
    ValoraAnalytics.track(IdentityEvents.address_lookup_error, {
      error: error.message,
    })
    // Setting this address to "false" does not mean that the address
    // if definitely unverified; we set it to false to indicate that
    // the request is finished, and possibly unverified.
    yield* put(addressVerificationStatusReceived(address, false))
  }
}

function* fetchWalletAddresses(e164Number: string) {
  try {
    const address = yield* select(walletAddressSelector)
    const signedMessage = yield* call(retrieveSignedMessage)

    const centralisedLookupQueryParams = new URLSearchParams({
      phoneNumber: e164Number,
      clientPlatform: Platform.OS,
      clientVersion: DeviceInfo.getVersion(),
    }).toString()

    const response: Response = yield* call(
      fetch,
      `${networkConfig.lookupPhoneNumberUrl}?${centralisedLookupQueryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Valora ${address}:${signedMessage}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to look up phone number: ${response.status} ${response.statusText}`)
    }

    const { data }: { data: { addresses: string[] } } = yield* call([response, 'json'])

    return data.addresses.map((address) => address.toLowerCase())
  } catch (error) {
    Logger.debug(`${TAG}/fetchWalletAddresses`, 'Unable to look up phone number', error)
    throw new Error('Unable to fetch wallet address for this phone number')
  }
}

function* fetchAddressVerification(address: string) {
  try {
    const walletAddress = yield* select(walletAddressSelector)
    const signedMessage = yield* call(retrieveSignedMessage)

    const addressVerificationQueryParams = new URLSearchParams({
      address,
      clientPlatform: Platform.OS,
      clientVersion: DeviceInfo.getVersion(),
    }).toString()

    const response: Response = yield* call(
      fetchWithTimeout,
      `${networkConfig.checkAddressVerifiedUrl}?${addressVerificationQueryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Valora ${walletAddress}:${signedMessage}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to look up address verification: ${response.status} ${response.statusText}`
      )
    }

    const { data }: { data: { addressVerified: boolean } } = yield* call([response, 'json'])
    return data.addressVerified
  } catch (error) {
    Logger.warn(`${TAG}/fetchAddressVerification`, 'Unable to look up address', error)
    throw new Error('Unable to fetch verification status for this address')
  }
}

// Returns a list of account addresses for the identifier received.
export function* lookupAccountAddressesForIdentifier(id: string, lostAccounts: string[] = []) {
  const contractKit = yield* call(getContractKit)
  const attestationsWrapper: AttestationsWrapper = yield* call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])

  const accounts = yield* call(
    [attestationsWrapper, attestationsWrapper.lookupAccountsForIdentifier],
    id
  )
  return accounts.filter((address: string) => !lostAccounts.includes(address.toLowerCase()))
}

// Deconstruct the lookup result and return
// any addresess that are considered verified
export function* filterNonVerifiedAddresses(accountAddresses: Address[], phoneHash: string) {
  if (!accountAddresses) {
    return []
  }

  const contractKit = yield* call(getContractKit)
  const attestationsWrapper: AttestationsWrapper = yield* call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])

  const verifiedAccountAddresses: Address[] = []
  for (const address of accountAddresses) {
    if (!isValidNon0Address(address)) {
      continue
    }
    // Get stats for the address
    const stats: AttestationStat = yield* call(
      [attestationsWrapper, attestationsWrapper.getAttestationStat],
      phoneHash,
      address
    )
    // Check if result for given hash is considered 'verified'
    const { isVerified } = isAccountConsideredVerified(stats)
    if (!isVerified) {
      Logger.debug(
        TAG + 'getAddressesFromLookupResult',
        `Address ${address} has attestation stats but is not considered verified. Skipping it.`
      )
      continue
    }
    verifiedAccountAddresses.push(address.toLowerCase())
  }

  return verifiedAccountAddresses
}

const isValidNon0Address = (address: string) =>
  typeof address === 'string' && isValidAddress(address) && !new BigNumber(address).isZero()

// Only use with multiple addresses if user has
// gone through SecureSend
export function getAddressFromPhoneNumber(
  e164Number: string,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping,
  requesterAddress?: string
): string | null | undefined {
  const addresses = e164NumberToAddress[e164Number]

  // If there are no verified addresses for the number,
  // use the requester's given address
  if (!addresses && requesterAddress) {
    return requesterAddress
  }

  // If address is null (unverified) or undefined (in the process
  // of being updated) then just return that falsy value
  if (!addresses) {
    return addresses
  }

  // If there are multiple addresses, need to determine which to use
  if (addresses.length > 1) {
    // Check if the user has gone through Secure Send and validated a
    // recipient address
    const validatedAddress = secureSendPhoneNumberMapping[e164Number]
      ? secureSendPhoneNumberMapping[e164Number].address
      : undefined

    // If they have not, they shouldn't have been able to
    // get to this point
    if (!validatedAddress) {
      throw new Error(
        'Multiple addresses but none were validated. Should have routed through Secure Send.'
      )
    }

    return validatedAddress
  }

  // Normal case when there is only one address in the mapping
  return addresses[0]
}

export function* saveContacts() {
  try {
    const saveContactsGate = getFeatureGate(StatsigFeatureGates.SAVE_CONTACTS)
    const phoneVerified = yield* select(phoneNumberVerifiedSelector)
    const contactsEnabled = yield* call(hasGrantedContactsPermission)

    if (!saveContactsGate || !phoneVerified || !contactsEnabled) {
      Logger.debug(`${TAG}/saveContacts`, "Skipping because pre conditions aren't met", {
        saveContactsGate,
        phoneVerified,
        contactsEnabled,
      })
      return
    }

    const recipientCache = yield* select(phoneRecipientCacheSelector)
    const ownPhoneNumber = yield* select(e164NumberSelector)
    const contacts = Object.keys(recipientCache).sort()
    const lastSavedContactsHash = yield* select(lastSavedContactsHashSelector)

    const hash = calculateSha256Hash(`${ownPhoneNumber}:${contacts.join(',')}`)

    if (hash === lastSavedContactsHash) {
      Logger.debug(
        `${TAG}/saveContacts`,
        'Skipping because contacts have not changed since last post'
      )
      return
    }

    const walletAddress = yield* select(walletAddressSelector)
    const signedMessage = yield* call(retrieveSignedMessage)

    const deviceId =
      Platform.OS === 'android'
        ? yield* call(DeviceInfo.getInstanceId)
        : yield* call(DeviceInfo.getUniqueId)

    const response: Response = yield* call(fetchWithTimeout, `${networkConfig.saveContactsUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora ${walletAddress}:${signedMessage}`,
      },
      body: JSON.stringify({
        phoneNumber: ownPhoneNumber,
        contacts,
        clientPlatform: Platform.OS,
        clientVersion: DeviceInfo.getVersion(),
        deviceId,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `Failed to post contacts: ${response.status} ${yield* call([response, 'text'])}`
      )
    }

    yield* put(contactsSaved(hash))
  } catch (err) {
    Logger.warn(`${TAG}/saveContacts`, 'Post contacts failed', err)
  }
}
