import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { FetchMock } from 'jest-fetch-mock'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { CiCoCurrency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import {
  mockAccount,
  mockFiatConnectProviderInfo,
  mockFiatConnectQuotes,
  mockGetFiatConnectQuotesResponse,
} from 'test/values'
import {
  addNewFiatAccount,
  fetchFiatConnectQuotes,
  FetchQuotesInput,
  FiatConnectProviderInfo,
  getFiatConnectProviders,
  getFiatConnectQuotes,
  QuotesInput,
} from './index'

jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('FiatConnect helpers', () => {
  const mockFetch = fetch as FetchMock

  beforeEach(() => {
    mockFetch.resetMocks()
    jest.clearAllMocks()
  })
  describe('getFiatConnectProviders', () => {
    it('Gives list of providers on success', async () => {
      const fakeProviderInfo: FiatConnectProviderInfo = {
        id: 'fake-provider',
        baseUrl: 'https://fake-provider.valoraapp.com',
        providerName: 'fake provider name',
        imageUrl: 'https://fake-icon.valoraapp.com',
      }
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [fakeProviderInfo] }), { status: 200 })
      const providers = await getFiatConnectProviders(mockAccount)
      expect(providers).toMatchObject([fakeProviderInfo])
    })
    it('Gives empty list and logs error on failure', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [] }), { status: 500 })
      const providers = await getFiatConnectProviders(mockAccount)
      expect(providers).toEqual([])
      expect(Logger.error).toHaveBeenCalled()
    })
  })

  describe('fetchFiatConnectQuotes', () => {
    const fetchQuotesInput: FetchQuotesInput = {
      fiatConnectEnabled: false,
      account: mockAccount,
      flow: CICOFlow.CashIn,
      localCurrency: LocalCurrencyCode.USD,
      digitalAsset: CiCoCurrency.CUSD,
      cryptoAmount: 100,
      country: 'US',
    }
    it('returns an empty array if fiatConnectEnabled is false', async () => {
      const quotes = await fetchFiatConnectQuotes(fetchQuotesInput)
      expect(quotes).toHaveLength(0)
    })
  })

  describe('getFiatConnectQuotes', () => {
    const getQuotesInput: QuotesInput = {
      flow: CICOFlow.CashIn,
      localCurrency: LocalCurrencyCode.USD,
      digitalAsset: CiCoCurrency.CUSD,
      cryptoAmount: 100,
      country: 'US',
      fiatConnectProviders: [mockFiatConnectProviderInfo],
    }
    it('returns an empty array if fiatType is not supported', async () => {
      const quotes = await getFiatConnectQuotes({
        ...getQuotesInput,
        localCurrency: LocalCurrencyCode.CAD,
      })
      expect(quotes).toHaveLength(0)
    })
    it('returns an empty array if fetch fails', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ quotes: [] }), { status: 500 })
      const quotes = await getFiatConnectQuotes(getQuotesInput)
      expect(quotes).toEqual([])
      expect(Logger.error).toHaveBeenCalled()
    })
    it('returns quotes', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ quotes: [mockGetFiatConnectQuotesResponse] }), {
        status: 200,
      })
      const quotes = await getFiatConnectQuotes(getQuotesInput)
      expect(quotes).toEqual([mockFiatConnectQuotes[1]])
      expect(Logger.error).not.toHaveBeenCalled()
    })
  })

  describe('addNewFiatAccount', () => {
    it('returns a fiat account info with fiat account id on success', async () => {
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

      await expect(
        addNewFiatAccount(fakeProviderURL, fiatAccountSchema, reqBody)
      ).rejects.toThrowError('Not implemented')
    })
  })
})
