import { FetchMock } from 'jest-fetch-mock'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import Logger from 'src/utils/Logger'
import { CiCoCurrency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'
import {
  mockAccount,
  mockFiatConnectProviderInfo,
  mockFiatConnectQuotes,
  mockGetFiatConnectQuotesResponse,
} from 'test/values'
import {
  FetchQuotesInput,
  FiatConnectProviderInfo,
  QuotesInput,
  fetchQuotes,
  getFiatConnectProviders,
  getFiatConnectQuotes,
  getObfuscatedAccountNumber,
  getObfuscatedEmail,
} from './index'

jest.mock('src/pincode/authentication', () => ({
  getPassword: jest.fn(),
}))

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn().mockReturnValue({ cico: 30 }),
}))

jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@fiatconnect/fiatconnect-sdk')

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
        baseUrl: 'https://fake-provider.example.com',
        providerName: 'fake provider name',
        imageUrl: 'https://fake-icon.example.com',
        websiteUrl: 'https://fake-provider.example.com',
        iconUrl: 'https://fake-icon.example.com',
        privacyPolicyUrl: 'https://fake-provider.example.com/privacy',
        termsAndConditionsUrl: 'https://fake-provider.example.com/terms',
        isNew: {
          in: true,
          out: false,
        },
      }
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [fakeProviderInfo] }), { status: 200 })
      const providers = await getFiatConnectProviders(mockAccount, 'fake-provider')
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.getFiatConnectProvidersUrl}?address=0x0000000000000000000000000000000000007E57&providers=fake-provider`,
        expect.any(Object)
      )
      expect(providers).toMatchObject([fakeProviderInfo])
    })
    it('Throws an error on failure', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [] }), { status: 500 })
      await expect(async () => await getFiatConnectProviders(mockAccount)).rejects.toThrow()

      expect(Logger.error).toHaveBeenCalled()
    })
    it('Does not call with providers query param if there are no providers', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [] }), { status: 200 })
      await getFiatConnectProviders(mockAccount)
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.getFiatConnectProvidersUrl}?address=0x0000000000000000000000000000000000007E57`,
        expect.any(Object)
      )
    })
  })

  describe('fetchFiatConnectQuotes', () => {
    const fetchQuotesInput: FetchQuotesInput = {
      fiatConnectCashInEnabled: false,
      fiatConnectCashOutEnabled: false,
      flow: CICOFlow.CashIn,
      localCurrency: LocalCurrencyCode.USD,
      digitalAsset: CiCoCurrency.cUSD,
      cryptoAmount: 100,
      fiatAmount: 100,
      country: 'US',
      fiatConnectProviders: [
        {
          id: 'fake-provider',
          baseUrl: 'https://fake-provider.example.com',
          providerName: 'fake provider name',
          imageUrl: 'https://fake-icon.example.com',
          websiteUrl: 'https://fake-provider.example.com',
          iconUrl: 'https://fake-icon.example.com',
          apiKey: 'fake-api-key',
          privacyPolicyUrl: 'https://fake-provider.example.com/privacy',
          termsAndConditionsUrl: 'https://fake-provider.example.com/terms',
          isNew: {
            in: true,
            out: false,
          },
        },
      ],
      address: '0xabc',
    }
    it('returns an empty array if fiatConnectCashInEnabled is false with cash in', async () => {
      const quotes = await fetchQuotes(fetchQuotesInput)
      expect(quotes).toHaveLength(0)
    })
    it('returns an empty array if fiatConnectCashOutEnabled is false with cash out', async () => {
      const quotes = await fetchQuotes({ ...fetchQuotesInput, flow: CICOFlow.CashOut })
      expect(quotes).toHaveLength(0)
    })
  })

  describe('getFiatConnectQuotes', () => {
    const getQuotesInput: QuotesInput = {
      flow: CICOFlow.CashIn,
      localCurrency: LocalCurrencyCode.USD,
      digitalAsset: CiCoCurrency.cUSD,
      cryptoAmount: 100,
      fiatAmount: 100,
      country: 'US',
      fiatConnectProviders: mockFiatConnectProviderInfo,
      address: '0xabc',
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
      mockFetch.mockResponseOnce(JSON.stringify({ quotes: mockGetFiatConnectQuotesResponse }), {
        status: 200,
      })
      const quotes = await getFiatConnectQuotes(getQuotesInput)
      expect(quotes).toEqual([mockFiatConnectQuotes[1], mockFiatConnectQuotes[0]])
      expect(Logger.error).not.toHaveBeenCalled()
    })
    it('calls with cryptoAmount for cash out', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ quotes: mockGetFiatConnectQuotesResponse }), {
        status: 200,
      })
      await getFiatConnectQuotes({ ...getQuotesInput, flow: CICOFlow.CashOut })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('cryptoAmount=100'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('fiatAmount=100'),
        expect.any(Object)
      )
      expect(Logger.error).not.toHaveBeenCalled()
    })
    it('calls with fiatAmount for cash in', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ quotes: mockGetFiatConnectQuotesResponse }), {
        status: 200,
      })
      await getFiatConnectQuotes(getQuotesInput)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('fiatAmount=100'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('cryptoAmount=100'),
        expect.any(Object)
      )
    })
    it('calls with fiatAmount for cash in when crypto is CELO', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ quotes: mockGetFiatConnectQuotesResponse }), {
        status: 200,
      })
      await getFiatConnectQuotes({ ...getQuotesInput, digitalAsset: CiCoCurrency.CELO })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('cryptoAmount=100'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('fiatAmount=100'),
        expect.any(Object)
      )
    })
  })
  describe('getObfuscatedAccountNumber', () => {
    it('shows last 4 digits for 10 digit account numbers (Nigeria case)', () => {
      expect(getObfuscatedAccountNumber('1234567890')).toEqual('...7890')
    })
    it('shows last 4 digits for 7 digit account numbers', () => {
      expect(getObfuscatedAccountNumber('1234567')).toEqual('...4567')
    })
    it('shows only 2 digits for 5 digit account numbers', () => {
      expect(getObfuscatedAccountNumber('12345')).toEqual('...45')
    })
    it('shows only 1 digit for 4 digit account numbers', () => {
      expect(getObfuscatedAccountNumber('1234')).toEqual('...4')
    })
    it('blanks out entire number for 3 digit account numbers and smaller', () => {
      expect(getObfuscatedAccountNumber('123')).toEqual('')
      expect(getObfuscatedAccountNumber('12')).toEqual('')
      expect(getObfuscatedAccountNumber('1')).toEqual('')
    })
  })

  describe('getObfuscatedEmail', () => {
    it('shows only first 3 characters and domain when username is greater than 3 characters', () => {
      expect(getObfuscatedEmail('veryLongUsername123456@domain.com')).toEqual('ver***@domain.com')
      expect(getObfuscatedEmail('testEmail@domain.com')).toEqual('tes***@domain.com')
    })
    it('shows only first 2 characters and domain when username is 3 characters', () => {
      expect(getObfuscatedEmail('123@domain.com')).toEqual('12***@domain.com')
    })
    it('shows only the first character and domain when username is 2 characters', () => {
      expect(getObfuscatedEmail('12@domain.com')).toEqual('1***@domain.com')
    })
    it('hides entire username when username is 1 character', () => {
      expect(getObfuscatedEmail('1@domain.com')).toEqual('***@domain.com')
    })
  })
})
