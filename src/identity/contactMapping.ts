import { Address } from '@celo/base'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { AttestationStat, AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { isValidAddress, normalizeAddressWith0x, NULL_ADDRESS } from '@celo/utils/lib/address'
import { isAccountConsideredVerified } from '@celo/utils/lib/attestations'
import BigNumber from 'bignumber.js'
import { Platform } from 'react-native'
import { MinimalContact } from 'react-native-contacts'
import DeviceInfo from 'react-native-device-info'
import { all, call, delay, put, race, select, take } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showErrorOrFallback } from 'src/alert/actions'
import { IdentityEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { decentralizedVerificationEnabledSelector } from 'src/app/selectors'
import { fetchLostAccounts } from 'src/firebase/firebase'
import {
  Actions,
  endFetchingAddresses,
  endImportContacts,
  FetchAddressesAndValidateAction,
  requireSecureSend,
  updateE164PhoneNumberAddresses,
  updateImportContactsProgress,
  updateWalletToAccountAddress,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import {
  AddressToE164NumberType,
  AddressValidationType,
  E164NumberToAddressType,
  SecureSendPhoneNumberMapping,
  WalletToAccountAddressType,
} from 'src/identity/reducer'
import { checkIfValidationRequired } from 'src/identity/secureSend'
import {
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { ImportContactsStatus } from 'src/identity/types'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { contactsToRecipients, NumberToRecipient } from 'src/recipients/recipient'
import { setPhoneRecipientCache } from 'src/recipients/reducer'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getAllContacts } from 'src/utils/contacts'
import Logger from 'src/utils/Logger'
import { checkContactsPermission } from 'src/utils/permissions'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'identity/contactMapping'
export const IMPORT_CONTACTS_TIMEOUT = 1 * 60 * 1000 // 1 minute

export function* doImportContactsWrapper() {
  yield call(getConnectedAccount)
  try {
    Logger.debug(TAG, 'Importing user contacts')

    const { result, cancel, timeout } = yield race({
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
    yield put(endImportContacts(true))
  } catch (error) {
    Logger.error(TAG, 'Error importing user contacts', error)
    ValoraAnalytics.track(IdentityEvents.contacts_import_error, { error: error.message })
    yield put(showErrorOrFallback(error, ErrorMessages.IMPORT_CONTACTS_FAILED))
    yield put(endImportContacts(false))
  }
}

function* doImportContacts() {
  const hasGivenContactPermission: boolean = yield call(checkContactsPermission)
  if (!hasGivenContactPermission) {
    Logger.warn(TAG, 'Contact permissions denied. Skipping import.')
    ValoraAnalytics.track(IdentityEvents.contacts_import_permission_denied)
    return true
  }

  ValoraAnalytics.track(IdentityEvents.contacts_import_start)

  SentryTransactionHub.startTransaction(SentryTransaction.import_contacts)
  yield put(updateImportContactsProgress(ImportContactsStatus.Importing))

  const contacts: MinimalContact[] = yield call(getAllContacts)
  ValoraAnalytics.track(IdentityEvents.contacts_import_complete, {
    contactImportCount: contacts.length,
  })
  if (!contacts || !contacts.length) {
    Logger.warn(TAG, 'Empty contacts list. Skipping import.')
    return true
  }

  yield put(updateImportContactsProgress(ImportContactsStatus.Processing, 0, contacts.length))

  const defaultCountryCode: string = yield select(defaultCountryCodeSelector)
  const e164NumberToRecipients = contactsToRecipients(contacts, defaultCountryCode)
  if (!e164NumberToRecipients) {
    Logger.warn(TAG, 'No recipients found')
    return true
  }

  yield call(updateUserContact, e164NumberToRecipients)
  Logger.debug(TAG, 'Updating recipients cache')
  yield put(setPhoneRecipientCache(e164NumberToRecipients))

  ValoraAnalytics.track(IdentityEvents.contacts_processing_complete)
  SentryTransactionHub.finishTransaction(SentryTransaction.import_contacts)

  return true
}

// Find the user's own contact among those imported and save useful bits
function* updateUserContact(e164NumberToRecipients: NumberToRecipient) {
  Logger.debug(TAG, 'Finding user contact details')
  const e164Number: string = yield select(e164NumberSelector)

  if (!e164Number) {
    return Logger.warn(TAG, 'User phone number not set, cannot find contact info')
  }

  const userRecipient = e164NumberToRecipients[e164Number]
  if (!userRecipient) {
    return Logger.debug(TAG, 'User contact not found among recipients')
  }

  yield put(setUserContactDetails(userRecipient.contactId, userRecipient.thumbnailPath || null))
}

export function* fetchAddressesAndValidateSaga({
  e164Number,
  requesterAddress,
}: FetchAddressesAndValidateAction) {
  ValoraAnalytics.track(IdentityEvents.phone_number_lookup_start)
  try {
    Logger.debug(TAG + '@fetchAddressesAndValidate', `Fetching addresses for number`)
    const oldE164NumberToAddress: E164NumberToAddressType = yield select(
      e164NumberToAddressSelector
    )
    const oldAddresses = oldE164NumberToAddress[e164Number] || []

    // Clear existing entries for those numbers so our mapping consumers know new status is pending.
    yield put(updateE164PhoneNumberAddresses({ [e164Number]: undefined }, {}))

    const walletAddresses: string[] = yield call(fetchWalletAddresses, e164Number)

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

    const userAddress = yield select(walletAddressSelector)
    const secureSendPossibleAddresses = [...walletAddresses]
    const secureSendPhoneNumberMapping = yield select(secureSendPhoneNumberMappingSelector)
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
      yield put(requireSecureSend(e164Number, addressValidationType))
    }
    yield put(
      updateE164PhoneNumberAddresses(e164NumberToAddressUpdates, addressToE164NumberUpdates)
    )
    yield put(endFetchingAddresses(e164Number, true))
    ValoraAnalytics.track(IdentityEvents.phone_number_lookup_complete)
  } catch (error) {
    Logger.debug(TAG + '@fetchAddressesAndValidate', `Error fetching addresses`, error)
    yield put(showErrorOrFallback(error, ErrorMessages.ADDRESS_LOOKUP_FAILURE))
    yield put(endFetchingAddresses(e164Number, false))
    ValoraAnalytics.track(IdentityEvents.phone_number_lookup_error, {
      error: error.message,
    })
  }
}

function* getAccountAddresses(e164Number: string) {
  const phoneHashDetails: PhoneNumberHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
  const phoneHash = phoneHashDetails.phoneHash
  const lostAccounts = yield call(fetchLostAccounts)
  const accountAddresses: Address[] = yield call(
    lookupAccountAddressesForIdentifier,
    phoneHash,
    lostAccounts
  )
  return yield call(filterNonVerifiedAddresses, accountAddresses, phoneHash)
}

export function* fetchWalletAddressesDecentralized(e164Number: string) {
  // once odis v1 is EOL'ed, we can remove this whole path for fetching wallet addresses
  const decentralizedVerificationEnabled = yield select(decentralizedVerificationEnabledSelector)
  if (!decentralizedVerificationEnabled) {
    return []
  }

  const contractKit = yield call(getContractKit)
  const accountsWrapper: AccountsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAccounts,
  ])

  const accountAddresses: Address[] = yield call(getAccountAddresses, e164Number)
  const walletAddresses: Address[] = yield all(
    accountAddresses.map((accountAddress) => call(accountsWrapper.getWalletAddress, accountAddress))
  )

  const possibleUserAddresses: Set<string> = new Set()
  const walletToAccountAddress: WalletToAccountAddressType = {}
  for (const [i, address] of walletAddresses.entries()) {
    const accountAddress = normalizeAddressWith0x(accountAddresses[i])
    const walletAddress = normalizeAddressWith0x(address)
    // `getWalletAddress` returns a null address when there isn't a wallet registered
    if (walletAddress !== NULL_ADDRESS) {
      walletToAccountAddress[walletAddress] = accountAddress
      possibleUserAddresses.add(walletAddress)
    } else {
      // NOTE: Only need this else block if we are not confident all wallets are registered
      walletToAccountAddress[accountAddress] = accountAddress
      possibleUserAddresses.add(accountAddress)
    }
  }
  yield put(updateWalletToAccountAddress(walletToAccountAddress))
  return Array.from(possibleUserAddresses)
}

function* fetchWalletAddresses(e164Number: string) {
  try {
    const address = yield select(walletAddressSelector)
    const signedMessage = yield call(retrieveSignedMessage)

    const centralisedLookupQueryParams = new URLSearchParams({
      phoneNumber: e164Number,
      clientPlatform: Platform.OS,
      clientVersion: DeviceInfo.getVersion(),
    }).toString()

    const [centralisedLookupResponse, addressesFromDecentralizedMapping]: [Response, string[]] =
      yield all([
        call(fetch, `${networkConfig.lookupPhoneNumberUrl}?${centralisedLookupQueryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Valora ${address}:${signedMessage}`,
          },
        }),
        call(fetchWalletAddressesDecentralized, e164Number),
      ])

    if (centralisedLookupResponse.ok) {
      const { data }: { data: { addresses: string[] } } = yield call([
        centralisedLookupResponse,
        'json',
      ])

      // combine with addresses found in decentralized mapping to maintain
      // backwards compatibilty with accounts that have not migrated to CPV
      return [
        ...new Set([
          ...data.addresses.map((address) => address.toLowerCase()),
          ...addressesFromDecentralizedMapping.map((address) => address.toLowerCase()),
        ]),
      ]
    } else {
      Logger.debug(
        `${TAG}/fetchWalletAddresses`,
        `lookupPhoneNumber service failed with status ${centralisedLookupResponse.status}`
      )
      // in the case that the user failed to migrate to CPV, the centralised
      // service will throw an error so we can only return the decentralised mapping
      return addressesFromDecentralizedMapping
    }
  } catch (error) {
    Logger.debug(`${TAG}/fetchWalletAddresses`, 'Unable to look up phone number', error)
    throw new Error('Unable to fetch wallet address for this phone number')
  }
}

// Returns a list of account addresses for the identifier received.
export function* lookupAccountAddressesForIdentifier(id: string, lostAccounts: string[] = []) {
  const contractKit = yield call(getContractKit)
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])

  const accounts = yield call(
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

  const contractKit = yield call(getContractKit)
  const attestationsWrapper: AttestationsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAttestations,
  ])

  const verifiedAccountAddresses: Address[] = []
  for (const address of accountAddresses) {
    if (!isValidNon0Address(address)) {
      continue
    }
    // Get stats for the address
    const stats: AttestationStat = yield call(
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
