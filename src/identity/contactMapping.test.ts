import { FetchMock } from 'jest-fetch-mock/types'
import { Platform } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { setUserContactDetails } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showError, showErrorOrFallback } from 'src/alert/actions'
import { IdentityEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import {
  Actions,
  addressVerificationStatusReceived,
  contactsSaved,
  fetchAddressVerification,
  fetchAddressesAndValidate,
  requireSecureSend,
  updateE164PhoneNumberAddresses,
} from 'src/identity/actions'
import {
  doImportContactsWrapper,
  fetchAddressVerificationSaga,
  fetchAddressesAndValidateSaga,
  saveContacts,
} from 'src/identity/contactMapping'
import { AddressValidationType } from 'src/identity/reducer'
import {
  addressToVerificationStatusSelector,
  e164NumberToAddressSelector,
  lastSavedContactsHashSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { contactsToRecipients } from 'src/recipients/recipient'
import { phoneRecipientCacheSelector, setPhoneRecipientCache } from 'src/recipients/reducer'
import { getFeatureGate } from 'src/statsig'
import Logger from 'src/utils/Logger'
import { getAllContacts, hasGrantedContactsPermission } from 'src/utils/contacts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import {
  mockAccount,
  mockContactList,
  mockContactWithPhone2,
  mockE164Number,
  mockE164Number2,
  mockE164Number2Invite,
  mockE164NumberInvite,
  mockPhoneRecipientCache,
} from 'test/values'

const recipients = contactsToRecipients(mockContactList, '+1')
const mockFetch = fetch as FetchMock
jest.unmock('src/pincode/authentication')
jest.mock('src/statsig')

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
      .spawn(saveContacts)
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
      .not.spawn(saveContacts)
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

describe('Fetch Address Verification Saga', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('fetches and stores verified address', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ data: { addressVerified: true } }))

    await expectSaga(fetchAddressVerificationSaga, fetchAddressVerification(mockAccount))
      .provide([
        [select(addressToVerificationStatusSelector), {}],
        [select(walletAddressSelector), '0xxyz'],
        [call(retrieveSignedMessage), 'some signed message'],
      ])
      .put(addressVerificationStatusReceived(mockAccount, true))
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.checkAddressVerifiedUrl}?address=${mockAccount}&clientPlatform=android&clientVersion=0.0.1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Valora 0xxyz:some signed message`,
        },
        signal: expect.any(AbortSignal),
      }
    )
  })

  it('skips fetching if address already known', async () => {
    await expectSaga(fetchAddressVerificationSaga, fetchAddressVerification(mockAccount))
      .provide([[select(addressToVerificationStatusSelector), { [mockAccount]: true }]])
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(0)
  })

  it('handles errors gracefully', async () => {
    mockFetch.mockReject()
    await expectSaga(fetchAddressVerificationSaga, fetchAddressVerification(mockAccount))
      .provide([
        [select(addressToVerificationStatusSelector), {}],
        [select(walletAddressSelector), '0xxyz'],
        [call(retrieveSignedMessage), 'some signed message'],
      ])
      .run()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(IdentityEvents.address_lookup_error, {
      error: 'Unable to fetch verification status for this address',
    })
  })
})

describe('saveContacts', () => {
  const warnSpy = jest.spyOn(Logger, 'warn')
  beforeEach(() => {
    mockFetch.resetMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
    jest.clearAllMocks()
  })

  it.each([
    { platform: 'ios', deviceId: 'abc-def-123' },
    { platform: 'android', deviceId: '123-456' },
  ])(
    'invokes saveContacts API and saves last posted hash if not already saved',
    async ({ platform, deviceId }) => {
      Platform.OS = platform as 'ios' | 'android'
      await expectSaga(saveContacts)
        .provide([
          [select(phoneNumberVerifiedSelector), true],
          [call(hasGrantedContactsPermission), true],
          [select(phoneRecipientCacheSelector), mockPhoneRecipientCache],
          [select(e164NumberSelector), mockE164Number],
          [select(lastSavedContactsHashSelector), null],
          [select(walletAddressSelector), '0xxyz'],
          [call(retrieveSignedMessage), 'some signed message'],
        ])
        .put(contactsSaved('72a546e3fc087906f225c620888cae129156a2413bbb1eb0f82f647cedde1350'))
        .run()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(networkConfig.saveContactsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Valora 0xxyz:some signed message`,
        },
        body: JSON.stringify({
          phoneNumber: mockE164Number,
          contacts: [mockE164NumberInvite, mockE164Number, mockE164Number2Invite],
          clientPlatform: platform,
          clientVersion: '0.0.1',
          deviceId,
        }),
        signal: expect.any(AbortSignal),
      })
    }
  )

  it('invokes saveContacts API and saves last posted hash if contacts are different', async () => {
    await expectSaga(saveContacts)
      .provide([
        [select(phoneNumberVerifiedSelector), true],
        [call(hasGrantedContactsPermission), true],
        [
          select(phoneRecipientCacheSelector),
          { ...mockPhoneRecipientCache, [mockE164Number2]: {} },
        ],
        [select(e164NumberSelector), mockE164Number],
        [
          select(lastSavedContactsHashSelector),
          '72a546e3fc087906f225c620888cae129156a2413bbb1eb0f82f647cedde1350',
        ],
        [select(walletAddressSelector), '0xxyz'],
        [call(retrieveSignedMessage), 'some signed message'],
      ])
      .put(contactsSaved('68498dee3633b92eb7b7107201e18a228b4a381b5cf222d59f6eaf75c19cca7d'))
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(networkConfig.saveContactsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora 0xxyz:some signed message`,
      },
      body: JSON.stringify({
        phoneNumber: mockE164Number,
        contacts: [mockE164Number2, mockE164NumberInvite, mockE164Number, mockE164Number2Invite],
        clientPlatform: 'android',
        clientVersion: '0.0.1',
        deviceId: '123-456',
      }),
      signal: expect.any(AbortSignal),
    })
  })

  it('skips if last saved contacts is the same as current', async () => {
    await expectSaga(saveContacts)
      .provide([
        [select(phoneNumberVerifiedSelector), true],
        [call(hasGrantedContactsPermission), true],
        [select(phoneRecipientCacheSelector), mockPhoneRecipientCache],
        [select(e164NumberSelector), mockE164Number],
        [
          select(lastSavedContactsHashSelector),
          '72a546e3fc087906f225c620888cae129156a2413bbb1eb0f82f647cedde1350',
        ],
        [select(walletAddressSelector), '0xxyz'],
        [call(retrieveSignedMessage), 'some signed message'],
      ])
      .not.put.actionType(Actions.CONTACTS_SAVED)
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(0)
  })

  it.each([
    { featureGate: false, phoneVerified: true, contactsEnabled: true, name: 'feature gate' },
    { featureGate: true, phoneVerified: false, contactsEnabled: true, name: 'phone unverified' },
    { featureGate: true, phoneVerified: true, contactsEnabled: false, name: 'contacts disabled' },
  ])(
    'skips if pre-conditions are not met - $name',
    async ({ featureGate, phoneVerified, contactsEnabled }) => {
      jest.mocked(getFeatureGate).mockReturnValue(featureGate)
      await expectSaga(saveContacts)
        .provide([
          [select(phoneNumberVerifiedSelector), phoneVerified],
          [call(hasGrantedContactsPermission), contactsEnabled],
        ])
        .not.select(phoneRecipientCacheSelector)
        .not.select(e164NumberSelector)
        .run()

      expect(mockFetch).toHaveBeenCalledTimes(0)
    }
  )

  it('handles errors gracefully and logs a warning', async () => {
    mockFetch.mockReject()
    await expectSaga(saveContacts)
      .provide([
        [select(phoneNumberVerifiedSelector), true],
        [call(hasGrantedContactsPermission), true],
        [select(phoneRecipientCacheSelector), mockPhoneRecipientCache],
        [select(e164NumberSelector), mockE164Number],
        [select(lastSavedContactsHashSelector), undefined],
        [select(walletAddressSelector), '0xxyz'],
        [call(retrieveSignedMessage), 'some signed message'],
      ])
      .not.put.actionType(Actions.CONTACTS_SAVED)
      .run()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(networkConfig.saveContactsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora 0xxyz:some signed message`,
      },
      body: JSON.stringify({
        phoneNumber: mockE164Number,
        contacts: [mockE164NumberInvite, mockE164Number, mockE164Number2Invite],
        clientPlatform: 'android',
        clientVersion: '0.0.1',
        deviceId: '123-456',
      }),
      signal: expect.any(AbortSignal),
    })
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})
