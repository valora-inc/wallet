import BigNumber from 'bignumber.js'
import {
  mockCusdAddress,
  mockExchanges,
  mockLegacyMobileMoneyProvider,
  mockTokenBalances,
} from '../../test/values'
import { CiCoCurrency, Currency } from '../utils/currencies'
import NormalizedQuote from './quotes/NormalizedQuote'
import { PaymentMethod, getProviderSelectionAnalyticsData } from './utils'

class MockNormalizedQuote extends NormalizedQuote {
  getCryptoType = jest.fn()
  getFeeInCrypto = jest.fn()
  getFeeInFiat = jest.fn()
  getKycInfo = jest.fn()
  getPaymentMethod = jest.fn()
  getProviderId = jest.fn()
  getProviderLogo = jest.fn()
  getProviderName = jest.fn()
  getTimeEstimation = jest.fn()
  navigate = jest.fn()
  isProviderNew = jest.fn()
}

describe('fiatExchanges utils', () => {
  const transferCryptoAmount = '10.00'
  const mockNormalizedQuote1 = new MockNormalizedQuote()
  const mockNormalizedQuote2 = new MockNormalizedQuote()
  const mockNormalizedQuote3 = new MockNormalizedQuote()
  const exchangeRates: { [token in Currency]: string | null } = {
    cUSD: '1',
    cGLD: '2',
    cEUR: '1.5',
  } // not important because NormalizedQuote class is mocked
  const normalizedQuotes = [mockNormalizedQuote1, mockNormalizedQuote2, mockNormalizedQuote3]

  mockNormalizedQuote1.getFeeInCrypto.mockReturnValue(new BigNumber(1))
  mockNormalizedQuote2.getFeeInCrypto.mockReturnValue(new BigNumber(2))
  mockNormalizedQuote3.getFeeInCrypto.mockReturnValue(null)

  mockNormalizedQuote1.getPaymentMethod.mockReturnValue(PaymentMethod.Card)
  mockNormalizedQuote2.getPaymentMethod.mockReturnValue(PaymentMethod.Bank)
  mockNormalizedQuote3.getPaymentMethod.mockReturnValue(PaymentMethod.FiatConnectMobileMoney)

  mockNormalizedQuote1.getKycInfo.mockReturnValue('idRequired')
  mockNormalizedQuote2.getKycInfo.mockReturnValue(null)
  mockNormalizedQuote3.getKycInfo.mockReturnValue(null)

  mockNormalizedQuote1.getProviderId.mockReturnValue('mock-provider-1')
  mockNormalizedQuote2.getProviderId.mockReturnValue('mock-provider-2')
  mockNormalizedQuote3.getProviderId.mockReturnValue('mock-provider-3')

  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getQuoteSelectionAnalyticsData', () => {
    it('returns analytics data aggregating all available payment methods', () => {
      const analyticsOutput = getProviderSelectionAnalyticsData({
        normalizedQuotes,
        exchangeRates,
        legacyMobileMoneyProviders: [mockLegacyMobileMoneyProvider],
        centralizedExchanges: mockExchanges,
        coinbasePayAvailable: true,
        transferCryptoAmount,
        cryptoType: CiCoCurrency.cUSD,
        tokenInfo: {
          ...mockTokenBalances[mockCusdAddress],
          lastKnownUsdPrice: new BigNumber('1'),
          usdPrice: new BigNumber('1'),
          balance: new BigNumber('10'),
        },
      })

      expect(analyticsOutput).toStrictEqual({
        transferCryptoAmount,
        centralizedExchangesAvailable: true,
        coinbasePayAvailable: true,
        cryptoType: CiCoCurrency.cUSD,
        totalOptions: 6, // centralized exchanges counts as 1, plus 1 legacy mobile money provider, 1 coinbase pay and 3 normalized quotes
        lowestFeeCryptoAmount: '1.00',
        lowestFeeKycRequired: true,
        lowestFeePaymentMethod: 'Card',
        lowestFeeProvider: 'mock-provider-1',
        paymentMethodsAvailable: {
          Bank: true,
          Card: true,
          MobileMoney: true,
          Coinbase: true,
          FiatConnectMobileMoney: true,
        },
      })
    })

    it('returns correct count when some payment methods are unavailable', () => {
      const analyticsOutput = getProviderSelectionAnalyticsData({
        normalizedQuotes,
        exchangeRates,
        legacyMobileMoneyProviders: [],
        centralizedExchanges: [],
        coinbasePayAvailable: false,
        transferCryptoAmount,
        cryptoType: CiCoCurrency.cUSD,
        tokenInfo: {
          ...mockTokenBalances[mockCusdAddress],
          lastKnownUsdPrice: new BigNumber('1'),
          usdPrice: new BigNumber('1'),
          balance: new BigNumber('10'),
        },
      })

      expect(analyticsOutput).toStrictEqual({
        transferCryptoAmount,
        centralizedExchangesAvailable: false,
        coinbasePayAvailable: false,
        cryptoType: CiCoCurrency.cUSD,
        totalOptions: 3, // 3 normalized quotes only
        lowestFeeCryptoAmount: '1.00',
        lowestFeeKycRequired: true,
        lowestFeePaymentMethod: 'Card',
        lowestFeeProvider: 'mock-provider-1',
        paymentMethodsAvailable: {
          Bank: true,
          Card: true,
          MobileMoney: false,
          Coinbase: false,
          FiatConnectMobileMoney: true,
        },
      })
    })
  })
})
