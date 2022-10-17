import {
  FiatAccountSchema,
  FiatAccountType,
  FiatType,
  KycSchema,
} from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { selectFiatConnectQuote } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import { mockFiatConnectProviderInfo, mockFiatConnectQuotes } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/web3/contracts', () => ({
  getWalletAsync: jest.fn(() => ({
    getAccounts: jest.fn(() => ['fake-account']),
  })),
}))

const mockExchangeRates = {
  cGLD: '2',
  cUSD: '2',
  cEUR: '2',
}

const getQuote = (baseFcQuote: FiatConnectQuoteSuccess, fiatAccountSchema: FiatAccountSchema) => {
  const quoteCopy = _.cloneDeep(baseFcQuote)
  quoteCopy.fiatAccount.BankAccount = {
    ...quoteCopy.fiatAccount.BankAccount,
    fiatAccountSchemas: [
      {
        fiatAccountSchema: fiatAccountSchema,
        allowedValues: {
          institutionName: ['Bank A', 'Bank B'],
        },
      },
    ],
  }
  return quoteCopy
}

const baseFcQuote = mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess

const accountNumberQuote = getQuote(baseFcQuote, FiatAccountSchema.AccountNumber)
const ibanQuote = getQuote(baseFcQuote, FiatAccountSchema.IBANNumber)

describe('FiatConnectQuote', () => {
  describe.each([
    [
      'AccountNumber',
      {
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
        schemaQuoteData: accountNumberQuote,
      },
    ],
    [
      'IbanNumber',
      {
        fiatAccountSchema: FiatAccountSchema.IBANNumber,
        schemaQuoteData: ibanQuote,
      },
    ],
  ])('%s test', (_title, { fiatAccountSchema, schemaQuoteData }) => {
    describe('constructor', () => {
      it('throws an error if fiatAccountType is not supported', () => {
        expect(
          () =>
            new FiatConnectQuote({
              flow: CICOFlow.CashIn,
              quote: schemaQuoteData,
              fiatAccountType: 'Foo' as FiatAccountType,
            })
        ).toThrow()
      })
      it('throws an error if at least one fiatAccountSchema is not supported', () => {
        const quoteData = {
          ...schemaQuoteData,
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
            })
        ).toThrow()
      })
      it('throws an error if KYC is required but not one of the supported schemas', () => {
        const quoteData = {
          ...schemaQuoteData,
          kyc: {
            kycRequired: true,
            kycSchemas: [{ kycSchema: 'fake-schema' as KycSchema, allowedValues: {} }],
          },
        }
        expect(
          () =>
            new FiatConnectQuote({
              flow: CICOFlow.CashIn,
              quote: quoteData,
              fiatAccountType: 'Foo' as FiatAccountType,
            })
        ).toThrow()
      })
    })
    describe('.getPaymentMethod', () => {
      it('returns Bank for BankAccount', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getPaymentMethod()).toEqual(PaymentMethod.Bank)
      })
    })

    describe('.getFeeInCrypto', () => {
      it('returns null if there is no fee', () => {
        const quoteData = _.cloneDeep(schemaQuoteData) as FiatConnectQuoteSuccess
        delete quoteData.quote.fee
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: quoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFeeInCrypto(mockExchangeRates)).toBeNull()
      })
      it('returns fee directly for cash out', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashOut,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFeeInCrypto(mockExchangeRates)).toEqual(new BigNumber(0.53))
      })
      it('returns converted fee for cash in', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFeeInCrypto(mockExchangeRates)).toEqual(new BigNumber(0.265))
      })
    })

    describe('.getFeeInFiat', () => {
      it('returns null if there is no fee', () => {
        const quoteData = _.cloneDeep(schemaQuoteData) as FiatConnectQuoteSuccess
        delete quoteData.quote.fee
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: quoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFeeInFiat(mockExchangeRates)).toBeNull()
      })
      it('returns fee directly for cash in', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFeeInFiat(mockExchangeRates)).toEqual(new BigNumber(0.53))
      })
      it('returns converted fee for cash out', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashOut,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFeeInFiat(mockExchangeRates)).toEqual(new BigNumber(1.06))
      })
    })

    describe('.getKycInfo', () => {
      it('returns null if there is no kyc', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getKycInfo()).toBeNull()
      })
    })

    describe('.getTimeEstimation', () => {
      it('returns numDays', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getTimeEstimation()).toEqual('selectProviderScreen.numDays')
      })
    })

    describe('.onPress', () => {
      it('returns a function that calls ValoraAnalytics', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        quote.onPress(CICOFlow.CashIn, createMockStore().dispatch)()
        expect(ValoraAnalytics.track).toHaveBeenCalled()
      })
    })

    describe('.navigate', () => {
      const store = createMockStore()
      store.dispatch = jest.fn()
      it('calls dispatch', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        quote.navigate(store.dispatch)
        expect(store.dispatch).toHaveBeenCalledWith(selectFiatConnectQuote({ quote }))
      })
    })

    describe('.getProviderInfo', () => {
      it('returns provider info', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getProviderInfo()).toEqual(mockFiatConnectProviderInfo[0])
      })
    })

    describe('.getProviderName', () => {
      it('returns provider name', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getProviderName()).toEqual('Provider Two')
      })
    })

    describe('.getProviderLogo', () => {
      it('returns provider logo', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
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
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getProviderId()).toEqual('provider-two')
      })
    })

    describe('.getProviderApiKey', () => {
      it('returns provider api key', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getProviderApiKey()).toEqual('fake-api-key')
      })
    })

    describe('.getFiatAmount', () => {
      it('returns fiat amount', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFiatAmount()).toEqual('100')
      })
    })

    describe('.getFiatType', () => {
      it('returns fiat type', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFiatType()).toEqual(FiatType.USD)
      })
    })

    describe('.getCryptoAmount', () => {
      it('returns crypto amount', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getCryptoAmount()).toEqual('100')
      })
    })

    describe('.getCryptoType', () => {
      it('returns crypto type', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getCryptoType()).toEqual(Currency.Dollar)
      })
    })

    describe('.getFiatAccountSchema', () => {
      it('returns fiat account schema', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFiatAccountSchema()).toEqual(fiatAccountSchema)
      })
    })

    describe('.getFiatAccountSchemaAllowedValues', () => {
      it('returns allowed values', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getFiatAccountSchemaAllowedValues()).toEqual({
          institutionName: ['Bank A', 'Bank B'],
        })
      })
    })

    describe('.getKycSchema', () => {
      it('returns required KYC schema when one exists', () => {
        const quoteData = {
          ...schemaQuoteData,
          kyc: {
            kycRequired: true,
            kycSchemas: [{ kycSchema: KycSchema.PersonalDataAndDocuments, allowedValues: {} }],
          },
        }
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashOut,
          quote: quoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getKycSchema()).toEqual(KycSchema.PersonalDataAndDocuments)
      })
      it('returns nothing when KYC is not required', () => {
        const quote = new FiatConnectQuote({
          flow: CICOFlow.CashIn,
          quote: schemaQuoteData,
          fiatAccountType: FiatAccountType.BankAccount,
        })
        expect(quote.getKycSchema()).toBeUndefined()
      })
    })
  })
})
