import { showErrorInline } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  ValidateRecipientAddressAction,
  validateRecipientAddressSuccess,
} from 'src/identity/actions'
import {
  doImportContactsWrapper,
  fetchAddressVerificationSaga,
  fetchAddressesAndValidateSaga,
  saveContacts,
} from 'src/identity/contactMapping'
import { AddressValidationType } from 'src/identity/reducer'
import { validateAndReturnMatch } from 'src/identity/secureSend'
import { e164NumberToAddressSelector } from 'src/identity/selectors'
import { recipientHasNumber } from 'src/recipients/recipient'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { currentAccountSelector } from 'src/web3/selectors'
import { cancelled, put, select, spawn, takeEvery, takeLatest, takeLeading } from 'typed-redux-saga'

const TAG = 'identity/saga'

export function* validateRecipientAddressSaga({
  userInputOfFullAddressOrLastFourDigits,
  addressValidationType,
  recipient,
  requesterAddress,
}: ValidateRecipientAddressAction) {
  Logger.debug(TAG, 'Starting Recipient Address Validation')
  try {
    if (!recipientHasNumber(recipient)) {
      throw Error(`Invalid recipient type for Secure Send, does not have e164Number`)
    }

    const userAddress = yield* select(currentAccountSelector)
    if (!userAddress) {
      // This should never happen
      throw Error(`No userAddress set`)
    }
    const e164NumberToAddress = yield* select(e164NumberToAddressSelector)
    const { e164PhoneNumber } = recipient
    const possibleRecievingAddresses = e164NumberToAddress[e164PhoneNumber]

    // Should never happen - Secure Send is initiated to deal with
    // there being several possible addresses
    if (!possibleRecievingAddresses) {
      throw Error('There are no possible recipient addresses to validate against')
    }

    // E164NumberToAddress in redux store only holds verified addresses
    // Need to add the requester address to the option set in the event
    // a request is coming from an unverified account
    if (requesterAddress && !possibleRecievingAddresses.includes(requesterAddress)) {
      possibleRecievingAddresses.push(requesterAddress)
    }

    const validatedAddress = validateAndReturnMatch(
      userInputOfFullAddressOrLastFourDigits,
      possibleRecievingAddresses,
      userAddress,
      addressValidationType
    )

    AppAnalytics.track(SendEvents.send_secure_complete, {
      confirmByScan: false,
      partialAddressValidation: addressValidationType === AddressValidationType.PARTIAL,
    })

    yield* put(validateRecipientAddressSuccess(e164PhoneNumber, validatedAddress))
  } catch (err) {
    const error = ensureError(err)
    AppAnalytics.track(SendEvents.send_secure_incorrect, {
      confirmByScan: false,
      partialAddressValidation: addressValidationType === AddressValidationType.PARTIAL,
      error: error.message,
    })

    Logger.error(TAG, 'validateRecipientAddressSaga/Address validation error: ', error)
    if (Object.values(ErrorMessages).includes(error.message as ErrorMessages)) {
      yield* put(showErrorInline(error.message as ErrorMessages))
    } else {
      yield* put(showErrorInline(ErrorMessages.ADDRESS_VALIDATION_ERROR))
    }
  }
}

function* watchContactMapping() {
  yield* takeLeading(Actions.IMPORT_CONTACTS, safely(doImportContactsWrapper))
  yield* takeLatest(
    Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS,
    safely(fetchAddressesAndValidateSaga)
  )
}

export function* watchValidateRecipientAddress() {
  yield* takeLatest(Actions.VALIDATE_RECIPIENT_ADDRESS, safely(validateRecipientAddressSaga))
}

function* watchFetchAddressVerification() {
  yield* takeEvery(Actions.FETCH_ADDRESS_VERIFICATION_STATUS, safely(fetchAddressVerificationSaga))
}

export function* identitySaga() {
  Logger.debug(TAG, 'Initializing identity sagas')
  try {
    yield* spawn(watchContactMapping)
    yield* spawn(watchValidateRecipientAddress)
    yield* spawn(watchFetchAddressVerification)
    yield* spawn(saveContacts) // save contacts on app start
  } catch (error) {
    Logger.error(TAG, 'Error initializing identity sagas', error)
  } finally {
    if (yield* cancelled()) {
      Logger.error(TAG, 'identity sagas prematurely cancelled')
    }
  }
}
