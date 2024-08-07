import {
  FiatAccountSchema,
  FiatAccountType,
  FiatType,
  KycSchema,
} from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { FiatExchangeEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import {
  DEFAULT_BANK_SETTLEMENT_ESTIMATION,
  DEFAULT_MOBILE_MONEY_SETTLEMENT_ESTIMATION,
  SettlementTime,
} from 'src/fiatExchanges/quotes/constants'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { selectFiatConnectQuote } from 'src/fiatconnect/slice'
import { NetworkId } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import {
  mockCusdAddress,
  mockCusdTokenId,
  mockFiatConnectProviderInfo,
  mockFiatConnectQuotes,
  mockProviderSelectionAnalyticsData,
} from 'test/values'

jest.mock('src/analytics/AppAnalytics')
jest.mock('src/web3/contracts', () => ({
  getWalletAsync: jest.fn(() => ({
    getAccounts: jest.fn(() => ['fake-account']),
  })),
}))
jest.mock('src/fiatExchanges/quotes/constants', () => {
  const originalModule = jest.requireActual('src/fiatExchanges/quotes/constants')

  return {
    ...originalModule,
    DEFAULT_ALLOWED_VALUES: {
      // Using AccountNumber because jest hoisting prevents us from using the
      // FiatAccountSchema enum.
      AccountNumber: {
        testKey: ['testDefaultValue'],
      },
    },
  }
})

const mockUsdToLocalRate = '2'

const mockTokenInfo = {
  balance: new BigNumber('10'),
  priceUsd: new BigNumber('1'),
  lastKnownPriceUsd: new BigNumber('1'),
  symbol: 'cUSD',
  tokenId: mockCusdTokenId,
  networkId: NetworkId['celo-alfajores'],
  address: mockCusdAddress,
  isFeeCurrency: true,
  canTransferWithComment: true,
  priceFetchedAt: Date.now(),
  decimals: 18,
  name: 'Celo Dollar',
  imageUrl: '',
}

describe('FiatConnectQuote', () => {
  describe('constructor', () => {
    it('throws an error if fiatAccountType is not supported', () => {
      expect(
        () =>
          new FiatConnectQuote({
            flow: CICOFlow.CashIn,
            quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
            fiatAccountType: 'Foo' as FiatAccountType,
            tokenId: mockCusdTokenId,
          })
      ).toThrow()
    })
    it('throws an error if at least one fiatAccountSchema is not supported', () => {
      const quoteData = {
        ...mockFiatConnectQuotes[1],
        fiatAccount: {
          BankAccount: {
            fiatAccountSchemas: [
              {
                fiatAccountSchema: 'SomethingUnsupported' as FiatAccountSchema,
                allowedValues: {},
              },
            ],
          },
        },
      }
      expect(
        () =>
          new FiatConnectQuote({
            flow: CICOFlow.CashIn,
            quote: quoteData as FiatConnectQuoteSuccess,
            fiatAccountType: FiatAccountType.BankAccount,
            tokenId: mockCusdTokenId,
          })
      ).toThrow()
    })
    it.each([
      [FiatAccountType.BankAccount, FiatAccountSchema.AccountNumber],
      [FiatAccountType.BankAccount, FiatAccountSchema.IBANNumber],
      [FiatAccountType.BankAccount, FiatAccountSchema.IFSCAccount],
      [FiatAccountType.BankAccount, FiatAccountSchema.PIXAccount],
      [FiatAccountType.MobileMoney, FiatAccountSchema.MobileMoney],
    ])(
      'does not throw an error if at least one fiatAccountSchema is supported',
      (fiatAccountType, fiatAccountSchema) => {
        const quoteData = {
          ...mockFiatConnectQuotes[1],
          fiatAccount: {
            [fiatAccountType]: {
              fiatAccountSchemas: [
                {
                  fiatAccountSchema,
                  allowedValues: {},
                },
              ],
            },
          },
        }
        expect(
          () =>
            new FiatConnectQuote({
              flow: CICOFlow.CashIn,
              quote: quoteData as FiatConnectQuoteSuccess,
              fiatAccountType,
              tokenId: mockCusdTokenId,
            })
        ).not.toThrow()
      }
    )
    it('throws an error if KYC is required but not one of the supported schemas', () => {
      expect(
        () =>
          new FiatConnectQuote({
            flow: CICOFlow.CashIn,
            quote: mockFiatConnectQuotes[2] as FiatConnectQuoteSuccess,
            fiatAccountType: 'Foo' as FiatAccountType,
            tokenId: mockCusdTokenId,
          })
      ).toThrow()
    })
  })
  describe('.getPaymentMethod', () => {
    it('returns Bank for BankAccount', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getPaymentMethod()).toEqual(PaymentMethod.Bank)
    })
    it('returns FC Mobile Money for MobileMoney', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[4] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.MobileMoney,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getPaymentMethod()).toEqual(PaymentMethod.FiatConnectMobileMoney)
    })
  })

  describe('.getFeeInCrypto', () => {
    it('returns null if there is no fee', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      delete quoteData.quote.fee
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toBeNull()
    })
    it('returns fee directly for cash out', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashOut,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(0.53))
    })
    it('returns converted fee for cash in', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(0.265))
    })
  })

  describe('.getFeeInFiat', () => {
    it('returns null if there is no fee', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      delete quoteData.quote.fee
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toBeNull()
    })
    it('returns fee directly for cash in', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(0.53))
    })
    it('returns converted fee for cash out', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashOut,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(1.06))
    })
  })

  describe('.getKycInfo', () => {
    it('returns null if there is no kyc', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getKycInfo()).toBeNull()
    })
  })

  describe('.getTimeEstimation', () => {
    it('returns default for bank account when no bounds are present', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quoteData.fiatAccount.BankAccount = {
        ...quoteData.fiatAccount.BankAccount!,
        settlementTimeLowerBound: undefined,
        settlementTimeUpperBound: undefined,
      }
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual(DEFAULT_BANK_SETTLEMENT_ESTIMATION)
    })

    it('returns default for mobile money when no bounds are present', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[4] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.MobileMoney,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual(DEFAULT_MOBILE_MONEY_SETTLEMENT_ESTIMATION)
    })

    it('when upper bound is less than one hour, "less than one hour" is shown', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quoteData.fiatAccount.BankAccount = {
        ...quoteData.fiatAccount.BankAccount!,
        settlementTimeLowerBound: '300', // 5 minutes
        settlementTimeUpperBound: '600', // 10 minutes
      }
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.LESS_THAN_ONE_HOUR,
      })
    })

    it('when lower bound is in minutes and upper bound is greater than one hour, "{lowerBound} to {upperBound} hours" is shown', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quoteData.fiatAccount.BankAccount = {
        ...quoteData.fiatAccount.BankAccount!,
        settlementTimeLowerBound: '300', // 5 minutes
        settlementTimeUpperBound: '7200', // 2 hours
      }
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.X_TO_Y_HOURS,
        lowerBound: 1,
        upperBound: 2,
      })
    })

    it('when lower bound is not present, "less than {upperBound}" is shown', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quoteData.fiatAccount.BankAccount = {
        ...quoteData.fiatAccount.BankAccount!,
        settlementTimeLowerBound: undefined,
        settlementTimeUpperBound: '7200', // 2 hours
      }
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.LESS_THAN_X_HOURS,
        upperBound: 2,
      })
    })

    it('when lower bound equals upper bound, "less than {upperBound}" is shown', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quoteData.fiatAccount.BankAccount = {
        ...quoteData.fiatAccount.BankAccount!,
        settlementTimeLowerBound: '7200', // 2 hours
        settlementTimeUpperBound: '7200', // 2 hours
      }
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.LESS_THAN_X_HOURS,
        upperBound: 2,
      })
    })

    it('when upper bound equals 24 hours, "less than 24 hours" is shown', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quoteData.fiatAccount.BankAccount = {
        ...quoteData.fiatAccount.BankAccount!,
        settlementTimeLowerBound: undefined,
        settlementTimeUpperBound: '86400', // 1 day
      }
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.LESS_THAN_X_HOURS,
        upperBound: 24,
      })
    })

    it('when upper bound is greater than 24 hours, but lower bound is less than day, "1 to {upperBound} days" shown', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quoteData.fiatAccount.BankAccount = {
        ...quoteData.fiatAccount.BankAccount!,
        settlementTimeLowerBound: '300', // 5 minutes
        settlementTimeUpperBound: '86401', // over 1 day (rounds up to two days)
      }
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.X_TO_Y_DAYS,
        lowerBound: 1,
        upperBound: 2,
      })
    })

    it('when upper bound is greater than 24 hours and lower bound equals upper, "less than {upperBound} days" shown', () => {
      const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quoteData.fiatAccount.BankAccount = {
        ...quoteData.fiatAccount.BankAccount!,
        settlementTimeLowerBound: '86401', // over 1 day (rounds up to two days)
        settlementTimeUpperBound: '86401', // over 1 day (rounds up to two days)
      }
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: quoteData,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.LESS_THAN_X_DAYS,
        upperBound: 2,
      })
    })
  })

  describe('.onPress', () => {
    it('returns a function that calls AppAnalytics with right properties for quote with lowest fee', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      quote.onPress(
        CICOFlow.CashIn,
        createMockStore().dispatch,
        mockProviderSelectionAnalyticsData,
        new BigNumber('1')
      )()
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_providers_quote_selected,
        {
          flow: CICOFlow.CashIn,
          paymentMethod: PaymentMethod.Bank,
          provider: mockFiatConnectQuotes[1].provider.id,
          feeCryptoAmount: 1.0,
          kycRequired: false,
          isLowestFee: true,
          ...mockProviderSelectionAnalyticsData,
        }
      )
    })

    it('returns a function that calls AppAnalytics with right properties for quote with higher fee', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      quote.onPress(
        CICOFlow.CashIn,
        createMockStore().dispatch,
        mockProviderSelectionAnalyticsData,
        new BigNumber('2')
      )()
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_providers_quote_selected,
        {
          flow: CICOFlow.CashIn,
          paymentMethod: PaymentMethod.Bank,
          provider: mockFiatConnectQuotes[1].provider.id,
          feeCryptoAmount: 2.0,
          kycRequired: false,
          isLowestFee: false,
          ...mockProviderSelectionAnalyticsData,
        }
      )
    })

    it('returns a function that calls AppAnalytics with right properties for quote with no fee', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      quote.onPress(
        CICOFlow.CashIn,
        createMockStore().dispatch,
        mockProviderSelectionAnalyticsData,
        undefined
      )()
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_providers_quote_selected,
        {
          flow: CICOFlow.CashIn,
          paymentMethod: PaymentMethod.Bank,
          provider: mockFiatConnectQuotes[1].provider.id,
          feeCryptoAmount: undefined,
          kycRequired: false,
          isLowestFee: undefined,
          ...mockProviderSelectionAnalyticsData,
        }
      )
    })
  })

  describe('.navigate', () => {
    const store = createMockStore()
    store.dispatch = jest.fn()
    it('calls dispatch', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      quote.navigate(store.dispatch)
      expect(store.dispatch).toHaveBeenCalledWith(selectFiatConnectQuote({ quote }))
    })
  })

  describe('.getProviderInfo', () => {
    it('returns provider info', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getProviderInfo()).toEqual(mockFiatConnectProviderInfo[0])
    })
  })

  describe('.getProviderName', () => {
    it('returns provider name', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getProviderName()).toEqual('Provider Two')
    })
  })

  describe('.getProviderLogo', () => {
    it('returns provider logo', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getProviderLogo()).toEqual(
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media'
      )
    })
  })

  describe('.getProviderId', () => {
    it('returns provider id', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getProviderId()).toEqual('provider-two')
    })
  })

  describe('.getProviderApiKey', () => {
    it('returns provider api key', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getProviderApiKey()).toEqual('fake-api-key')
    })
  })

  describe('.getFiatAmount', () => {
    it('returns fiat amount', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFiatAmount()).toEqual('100')
    })
  })

  describe('.getFiatType', () => {
    it('returns fiat type', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFiatType()).toEqual(FiatType.USD)
    })
  })

  describe('.getCryptoAmount', () => {
    it('returns crypto amount', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getCryptoAmount()).toEqual('100')
    })
  })

  describe('.getCryptoType', () => {
    it('returns crypto type', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getCryptoType()).toEqual(Currency.Dollar)
    })
  })

  describe('.getFiatAccountSchema', () => {
    it('returns fiat account schema', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFiatAccountSchema()).toEqual(FiatAccountSchema.AccountNumber)
    })
  })

  describe('.getFiatAccountSchemaAllowedValues', () => {
    it('returns allowed values', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFiatAccountSchemaAllowedValues('institutionName')).toEqual([
        'Bank A',
        'Bank B',
      ])
    })
    it('returns default value when quote has no value for a key', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFiatAccountSchemaAllowedValues('testKey')).toEqual(['testDefaultValue'])
    })
  })

  describe('.getKycSchema', () => {
    it('returns required KYC schema when one exists', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashOut,
        quote: mockFiatConnectQuotes[3] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getKycSchema()).toEqual(KycSchema.PersonalDataAndDocuments)
    })
    it('returns nothing when KYC is not required', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getKycSchema()).toBeUndefined()
    })
  })

  describe('.isProviderNew', () => {
    it('returns from provider info for cash in', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.isProviderNew()).toEqual(true)
    })

    it('returns from provider info for cash out', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashOut,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.isProviderNew()).toEqual(false)
    })
  })

  describe('.getReceiveAmount', () => {
    it('returns crypto amount for cash ins', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getReceiveAmount()).toEqual(new BigNumber(quote.getCryptoAmount()))
    })
    it('returns fiat amount for cash out', () => {
      const quote = new FiatConnectQuote({
        flow: CICOFlow.CashOut,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getReceiveAmount()).toEqual(new BigNumber(quote.getFiatAmount()))
    })
  })
})
