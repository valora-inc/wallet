import { getProviderSelectionAnalyticsData, PaymentMethod } from './utils'
import { Currency } from '../utils/currencies'
import { mockExchanges, mockLegacyMobileMoneyProvider } from '../../test/values'
import BigNumber from 'bignumber.js'
import NormalizedQuote from './quotes/NormalizedQuote'

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
}

describe('fiatExchanges utils', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('getQuoteSelectionAnalyticsData', () => {
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
    mockNormalizedQuote3.getPaymentMethod.mockReturnValue(PaymentMethod.MobileMoney)

    mockNormalizedQuote1.getKycInfo.mockReturnValue('idRequired')
    mockNormalizedQuote2.getKycInfo.mockReturnValue(null)
    mockNormalizedQuote3.getKycInfo.mockReturnValue(null)

    mockNormalizedQuote1.getProviderId.mockReturnValue('mock-provider-1')
    mockNormalizedQuote2.getProviderId.mockReturnValue('mock-provider-2')
    mockNormalizedQuote3.getProviderId.mockReturnValue('mock-provider-3')

    const analyticsOutput = getProviderSelectionAnalyticsData({
      normalizedQuotes,
      exchangeRates,
      legacyMobileMoneyProviders: [mockLegacyMobileMoneyProvider],
      centralizedExchanges: mockExchanges,
      transferCryptoAmount,
    })

    expect(analyticsOutput).toStrictEqual({
      transferCryptoAmount,
      centralizedExchangesAvailable: true,
      totalOptions: 5, // centralized exchanges counts as 1, plus 1 legacy mobile money provider and 3 normalized quotes
      lowestFeeCryptoAmount: '1.00',
      lowestFeeKycRequired: true,
      lowestFeePaymentMethod: 'Card',
      lowestFeeProvider: 'mock-provider-1',
      paymentMethodsAvailable: {
        Bank: true,
        Card: true,
        MobileMoney: true,
        Coinbase: false,
      },
    })
  })
})
