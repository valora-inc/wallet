import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { FetchMock } from 'jest-fetch-mock'
import Logger from '../utils/Logger'
import { addNewFiatAccount, FiatConnectClientConfig, getFiatConnectProviders } from './index'

describe('FiatConnect helpers', () => {
  const mockFetch = fetch as FetchMock

  beforeEach(() => {
    mockFetch.resetMocks()
    jest.clearAllMocks()
  })
  describe('getFiatConnectProviders', () => {
    it('Gives list of providers on success', async () => {
      const fakeProviderInfo: FiatConnectClientConfig = {
        baseUrl: 'https://fake-provider.valoraapp.com',
        providerName: 'fake provider name',
        iconUrl: 'https://fake-icon.valoraapp.com',
      }
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [fakeProviderInfo] }), { status: 200 })
      const providers = await getFiatConnectProviders()
      expect(providers).toMatchObject([fakeProviderInfo])
    })
    it('Gives empty list and logs error on failure', async () => {
      const mockLogError = jest.fn()
      jest.spyOn(Logger, 'error').mockImplementation(mockLogError)
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [] }), { status: 500 })
      const providers = await getFiatConnectProviders()
      expect(mockLogError).toHaveBeenCalled()
      expect(providers).toEqual([])
    })
  })

  describe('addNewFiatAccount', () => {
    // TODO: unskip after integration with FC SDK
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('returns a fiat account info with fiat account id on success', async () => {
      const fakeFiatAccountReturned = {
        fiatAccountId: 'ZAQWSX1234',
        accountName: 'Fake Account Name',
        institutionName: 'Fake Institution Name',
        fiatAccountType: FiatAccountType.BankAccount,
      }
      mockFetch.mockResponseOnce(JSON.stringify(fakeFiatAccountReturned), { status: 200 })

      const fakeProviderURL = 'superLegitCICOProvider.valoraapp.com'
      const fiatAccountSchema = FiatAccountSchema.AccountNumber
      const reqBody = {
        accountName: 'Fake Account Name',
        institutionName: 'Fake Institution Name',
        accountNumber: '123456789',
        country: 'NG',
        fiatAccountType: FiatAccountType.BankAccount,
      }
      const newFiatAccountadded = await addNewFiatAccount(
        fakeProviderURL,
        fiatAccountSchema,
        reqBody
      )
      expect(newFiatAccountadded).toMatchObject(fakeFiatAccountReturned)
    })
  })
})
