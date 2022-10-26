import { CICOFlow, getQuoteSelectionAnalyticsData, PaymentMethod } from './utils'
import ExternalQuote from './quotes/ExternalQuote'
import { Currency } from '../utils/currencies'
import {
  mockExchanges,
  mockFiatConnectQuoteSuccess,
  mockLegacyMobileMoneyProvider,
  mockMoonPayQuotes,
  mockProviders,
  mockSimplexQuote,
} from '../../test/values'
import FiatConnectQuote from './quotes/FiatConnectQuote'
import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'

// const externalQuoteMockImplementation = {
//   getFeeInCrypto: jest.fn(),
//   getPaymentMethod: jest.fn(),
//   getProviderName: jest.fn(),
//   getKycInfo: jest.fn(),
//   getProviderId: jest.fn()
// }
// const fiatConnectQuoteMockImplementation = {
//   getFeeInCrypto: jest.fn(),
//   getPaymentMethod: jest.fn(),
//   getProviderName: jest.fn(),
//   getKycInfo: jest.fn(),
//   getProviderId: jest.fn()
// }
// jest.mock('./quotes/ExternalQuote', () => externalQuoteMockImplementation)
// jest.mock('./quotes/FiatConnectQuote', () => fiatConnectQuoteMockImplementation)

describe('fiatExchanges utils', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('getQuoteSelectionAnalyticsData', () => {
    const mockSimplex = mockProviders[0]
    const exchangeRates: { [token in Currency]: string | null } = {
      cUSD: '1',
      cGLD: '2',
      cEUR: '1.5',
    } // not important because NormalizedQuote class is mocked
    const mockMoonPay = mockProviders[1]
    const mockMoonPayQuote = mockMoonPayQuotes[0]
    const simplexNormalizedQuote = new ExternalQuote({
      quote: mockSimplexQuote, // fees and amounts not important because fees mocked
      provider: mockSimplex,
      flow: CICOFlow.CashIn,
    })
    const moonPayNormalizedQuote = new ExternalQuote({
      quote: mockMoonPayQuote, // fees and amounts not important because fees mocked
      provider: mockMoonPay,
      flow: CICOFlow.CashIn,
    })
    const fiatConnectNormalizedQuote = new FiatConnectQuote({
      quote: mockFiatConnectQuoteSuccess, // fees and amounts not important because fees mocked
      fiatAccountType: FiatAccountType.BankAccount,
      flow: CICOFlow.CashIn,
    })
    const normalizedQuotes = [
      simplexNormalizedQuote,
      moonPayNormalizedQuote,
      fiatConnectNormalizedQuote,
    ]
    const analyticsOutput = getQuoteSelectionAnalyticsData({
      normalizedQuotes,
      exchangeRates,
      legacyMobileMoneyProviders: [mockLegacyMobileMoneyProvider],
      centralizedExchanges: mockExchanges,
    })

    simplexNormalizedQuote.getFeeInCrypto = jest.fn().mockReturnValue(new BigNumber(2))
    moonPayNormalizedQuote.getFeeInCrypto = jest.fn().mockReturnValue(null)
    fiatConnectNormalizedQuote.getFeeInCrypto = jest.fn().mockResolvedValue(new BigNumber(1))

    simplexNormalizedQuote.getPaymentMethod = jest.fn().mockReturnValue(PaymentMethod.Card)
    moonPayNormalizedQuote.getPaymentMethod = jest.fn().mockReturnValue(PaymentMethod.Card)
    fiatConnectNormalizedQuote.getPaymentMethod = jest.fn().mockReturnValue(PaymentMethod.Bank)

    simplexNormalizedQuote.getKycInfo = jest.fn().mockReturnValue('idRequired')
    moonPayNormalizedQuote.getKycInfo = jest.fn().mockReturnValue(null)
    fiatConnectNormalizedQuote.getKycInfo = jest.fn().mockReturnValue(null)

    simplexNormalizedQuote.getProviderName = jest.fn().mockReturnValue('simplex')
    moonPayNormalizedQuote.getProviderName = jest.fn().mockReturnValue('moonPay')
    fiatConnectNormalizedQuote.getProviderName = jest.fn().mockReturnValue('bitssa')

    expect(analyticsOutput).toStrictEqual({
      centralizedExchangesAvailable: 3,
      providersAvailable: 4,
      lowestFeeCryptoAmount: '1',
      lowestFeeKycRequired: false,
      lowestFeePaymentMethod: 'Bank',
      paymentMethodsAvailable: {
        Bank: true,
        Card: true,
        MobileMoney: true,
        Coinbase: false,
      },
    })
  })
})
