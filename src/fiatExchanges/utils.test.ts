import BigNumber from 'bignumber.js'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import {
  mockCusdTokenId,
  mockExchanges,
  mockLegacyMobileMoneyProvider,
  mockTokenBalances,
} from '../../test/values'
import { CiCoCurrency } from '../utils/currencies'
import NormalizedQuote from './quotes/NormalizedQuote'
import { PaymentMethod, fetchExchanges, getProviderSelectionAnalyticsData } from './utils'
import networkConfig from 'src/web3/networkConfig'

class MockNormalizedQuote extends NormalizedQuote {
  getCryptoType = jest.fn()
  getFeeInCrypto = jest.fn()
  getFeeInFiat = jest.fn()
  getKycInfo = jest.fn()
  getMobileCarrier = jest.fn()
  getPaymentMethod = jest.fn()
  getProviderId = jest.fn()
  getProviderLogo = jest.fn()
  getProviderName = jest.fn()
  getTimeEstimation = jest.fn()
  navigate = jest.fn()
  isProviderNew = jest.fn()
  getReceiveAmount = jest.fn()
  getTokenId = jest.fn()
}

jest.mock('../utils/fetchWithTimeout')
const mockGetExchangesResponse = [{ name: 'exchange-name', link: 'provider-link' }]
jest
  .mocked(fetchWithTimeout)
  .mockResolvedValue(new Response(JSON.stringify(mockGetExchangesResponse)))

describe('fiatExchanges utils', () => {
  const transferCryptoAmount = 10.0
  const mockNormalizedQuote1 = new MockNormalizedQuote()
  const mockNormalizedQuote2 = new MockNormalizedQuote()
  const mockNormalizedQuote3 = new MockNormalizedQuote()
  const mockNormalizedQuote4 = new MockNormalizedQuote()
  const usdToLocalRate = '1' // not important because NormalizedQuote class is mocked
  const normalizedQuotes = [
    mockNormalizedQuote1,
    mockNormalizedQuote2,
    mockNormalizedQuote3,
    mockNormalizedQuote4,
  ]

  mockNormalizedQuote1.getFeeInCrypto.mockReturnValue(new BigNumber(1))
  mockNormalizedQuote2.getFeeInCrypto.mockReturnValue(new BigNumber(2))
  mockNormalizedQuote3.getFeeInCrypto.mockReturnValue(null)
  mockNormalizedQuote4.getFeeInCrypto.mockReturnValue(new BigNumber(4))

  mockNormalizedQuote1.getPaymentMethod.mockReturnValue(PaymentMethod.Card)
  mockNormalizedQuote2.getPaymentMethod.mockReturnValue(PaymentMethod.Bank)
  mockNormalizedQuote3.getPaymentMethod.mockReturnValue(PaymentMethod.FiatConnectMobileMoney)
  mockNormalizedQuote4.getPaymentMethod.mockReturnValue(PaymentMethod.Airtime)

  mockNormalizedQuote1.getKycInfo.mockReturnValue('idRequired')
  mockNormalizedQuote2.getKycInfo.mockReturnValue(null)
  mockNormalizedQuote3.getKycInfo.mockReturnValue(null)
  mockNormalizedQuote4.getKycInfo.mockReturnValue(null)

  mockNormalizedQuote1.getProviderId.mockReturnValue('mock-provider-1')
  mockNormalizedQuote2.getProviderId.mockReturnValue('mock-provider-2')
  mockNormalizedQuote3.getProviderId.mockReturnValue('mock-provider-3')
  mockNormalizedQuote4.getProviderId.mockReturnValue('mock-provider-4')

  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getQuoteSelectionAnalyticsData', () => {
    it('returns analytics data aggregating all available payment methods', () => {
      const analyticsOutput = getProviderSelectionAnalyticsData({
        normalizedQuotes,
        usdToLocalRate,
        legacyMobileMoneyProviders: [mockLegacyMobileMoneyProvider],
        centralizedExchanges: mockExchanges,
        coinbasePayAvailable: true,
        transferCryptoAmount,
        cryptoType: CiCoCurrency.cUSD,
        tokenInfo: {
          ...mockTokenBalances[mockCusdTokenId],
          lastKnownPriceUsd: new BigNumber('1'),
          priceUsd: new BigNumber('1'),
          balance: new BigNumber('10'),
        },
      })

      expect(analyticsOutput).toStrictEqual({
        transferCryptoAmount,
        centralizedExchangesAvailable: true,
        coinbasePayAvailable: true,
        cryptoType: CiCoCurrency.cUSD,
        totalOptions: 7, // centralized exchanges counts as 1, plus 1 legacy mobile money provider, 1 coinbase pay and 4 normalized quotes
        lowestFeeCryptoAmount: 1.0,
        lowestFeeKycRequired: true,
        lowestFeePaymentMethod: 'Card',
        lowestFeeProvider: 'mock-provider-1',
        paymentMethodsAvailable: {
          Airtime: true,
          Bank: true,
          Card: true,
          MobileMoney: true,
          Coinbase: true,
          FiatConnectMobileMoney: true,
        },
        networkId: 'celo-alfajores',
      })
    })

    it('returns correct count when some payment methods are unavailable', () => {
      const analyticsOutput = getProviderSelectionAnalyticsData({
        normalizedQuotes,
        usdToLocalRate,
        legacyMobileMoneyProviders: [],
        centralizedExchanges: [],
        coinbasePayAvailable: false,
        transferCryptoAmount,
        cryptoType: CiCoCurrency.cUSD,
        tokenInfo: {
          ...mockTokenBalances[mockCusdTokenId],
          lastKnownPriceUsd: new BigNumber('1'),
          priceUsd: new BigNumber('1'),
          balance: new BigNumber('10'),
        },
      })

      expect(analyticsOutput).toStrictEqual({
        transferCryptoAmount,
        centralizedExchangesAvailable: false,
        coinbasePayAvailable: false,
        cryptoType: CiCoCurrency.cUSD,
        totalOptions: 4, // 4 normalized quotes only
        lowestFeeCryptoAmount: 1.0,
        lowestFeeKycRequired: true,
        lowestFeePaymentMethod: 'Card',
        lowestFeeProvider: 'mock-provider-1',
        paymentMethodsAvailable: {
          Airtime: true,
          Bank: true,
          Card: true,
          MobileMoney: false,
          Coinbase: false,
          FiatConnectMobileMoney: true,
        },
        networkId: 'celo-alfajores',
      })
    })
  })
  describe('fetchExchanges', () => {
    it('fetchExchanges works as expected', async () => {
      const exchanges = await fetchExchanges('US', 'mock-token-id')
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        `${networkConfig.fetchExchangesUrl}?country=US&tokenId=mock-token-id`,
        undefined,
        30000
      )
      expect(exchanges).toStrictEqual(mockGetExchangesResponse)
    })
  })
})
