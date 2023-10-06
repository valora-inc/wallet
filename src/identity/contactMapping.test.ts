import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showError, showErrorOrFallback } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  fetchAddressesAndValidate,
  requireSecureSend,
  updateE164PhoneNumberAddresses,
} from 'src/identity/actions'
import { doImportContactsWrapper, fetchAddressesAndValidateSaga } from 'src/identity/contactMapping'
import { AddressValidationType } from 'src/identity/reducer'
import {
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { contactsToRecipients } from 'src/recipients/recipient'
import { setPhoneRecipientCache } from 'src/recipients/reducer'
import { getAllContacts } from 'src/utils/contacts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockContactList, mockContactWithPhone2, mockE164Number } from 'test/values'

const recipients = contactsToRecipients(mockContactList, '+1')
const mockFetch = fetch as FetchMock
jest.unmock('src/pincode/authentication')

describe('Import Contacts Saga', () => {
  it('imports contacts and creates contact mappings correctly', async () => {
    await expectSaga(doImportContactsWrapper)
      .provide([
        [call(getConnectedAccount), null],
        [call(getAllContacts), mockContactList],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberSelector), mockE164Number],
      ])
      .put(
        setUserContactDetails(
          mockContactWithPhone2.recordID,
          mockContactWithPhone2.thumbnailPath || null
        )
      )
      .put(setPhoneRecipientCache(recipients))
      .run()
  })

  it('shows errors correctly', async () => {
    await expectSaga(doImportContactsWrapper)
      .provide([
        [call(getConnectedAccount), null],
        [call(getAllContacts), throwError(new Error('fake error'))],
        [select(defaultCountryCodeSelector), '+1'],
        [select(e164NumberSelector), mockE164Number],
      ])
      .put(showError(ErrorMessages.IMPORT_CONTACTS_FAILED))
      .run()
  })
})

describe('Fetch Addresses Saga', () => {
  describe('central lookup', () => {
    beforeEach(() => {
      mockFetch.resetMocks()
    })

    it('fetches and caches addresses correctly', async () => {
      const mockE164NumberToAddress = {
        [mockE164Number]: [mockAccount.toLowerCase()],
      }
      const updatedAccount = '0xAbC'
      mockFetch.mockResponseOnce(JSON.stringify({ data: { addresses: [updatedAccount] } }))

      await expectSaga(fetchAddressesAndValidateSaga, fetchAddressesAndValidate(mockE164Number))
        .provide([
          [select(e164NumberToAddressSelector), mockE164NumberToAddress],
          [select(walletAddressSelector), '0xxyz'],
          [call(retrieveSignedMessage), 'some signed message'],
          [select(secureSendPhoneNumberMappingSelector), {}],
        ])
        .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
        .put(
          updateE164PhoneNumberAddresses(
            { [mockE164Number]: ['0xabc'] },
            { '0xabc': mockE164Number }
          )
        )
        .run()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.lookupPhoneNumberUrl}?phoneNumber=%2B14155550000&clientPlatform=android&clientVersion=0.0.1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Valora 0xxyz:some signed message`,
          },
        }
      )
    })

    it('fetches and caches multiple addresses correctly', async () => {
      const mockE164NumberToAddress = {
        [mockE164Number]: [mockAccount.toLowerCase()],
      }
      const updatedAccounts = ['0xAbC', '0xdef']
      mockFetch.mockResponseOnce(JSON.stringify({ data: { addresses: updatedAccounts } }))

      await expectSaga(fetchAddressesAndValidateSaga, fetchAddressesAndValidate(mockE164Number))
        .provide([
          [select(e164NumberToAddressSelector), mockE164NumberToAddress],
          [select(walletAddressSelector), mockAccount],
          [call(retrieveSignedMessage), 'some signed message'],
          [select(secureSendPhoneNumberMappingSelector), {}],
        ])
        .put(updateE164PhoneNumberAddresses({ [mockE164Number]: undefined }, {}))
        .put(
          updateE164PhoneNumberAddresses(
            { [mockE164Number]: ['0xabc', '0xdef'] },
            { '0xabc': mockE164Number, '0xdef': mockE164Number }
          )
        )
        .put(requireSecureSend(mockE164Number, AddressValidationType.PARTIAL))
        .run()
    })

    it('handles lookup errors correctly', async () => {
      const mockE164NumberToAddress = {
        [mockE164Number]: [mockAccount.toLowerCase()],
      }
      mockFetch.mockReject()

      await expectSaga(fetchAddressesAndValidateSaga, fetchAddressesAndValidate(mockE164Number))
        .provide([
          [select(e164NumberToAddressSelector), mockE164NumberToAddress],
          [select(walletAddressSelector), mockAccount],
          [call(retrieveSignedMessage), 'some signed message'],
        ])
        .put(showErrorOrFallback(expect.anything(), ErrorMessages.ADDRESS_LOOKUP_FAILURE))
        .run()
    })
  })
})
