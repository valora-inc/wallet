import BigNumber from 'bignumber.js'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SettlementTime } from 'src/fiatExchanges/quotes/constants'
import ExternalQuote from 'src/fiatExchanges/quotes/ExternalQuote'
import { CICOFlow, PaymentMethod, RawProviderQuote, SimplexQuote } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { CiCoCurrency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockProviders, mockProviderSelectionAnalyticsData } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

const mockUsdToLocalRate = '2'

const mockTokenInfo = {
  balance: new BigNumber('10'),
  usdPrice: new BigNumber('1'),
  lastKnownUsdPrice: new BigNumber('1'),
  symbol: 'cUSD',
  address: mockCusdAddress,
  isCoreToken: true,
  priceFetchedAt: Date.now(),
  decimals: 18,
  name: 'Celo Dollar',
  imageUrl: '',
}

describe('ExternalQuote', () => {
  describe('constructor', () => {
    it('throws an error if provider is unavailable', () => {
      expect(
        () =>
          new ExternalQuote({
            quote: (mockProviders[4].quote as RawProviderQuote[])[0],
            provider: mockProviders[4],
            flow: CICOFlow.CashIn,
          })
      ).toThrow()
    })
    it('throws an error if provider is restricted', () => {
      expect(
        () =>
          new ExternalQuote({
            quote: (mockProviders[3].quote as RawProviderQuote[])[0],
            provider: mockProviders[3],
            flow: CICOFlow.CashIn,
          })
      ).toThrow()
    })
    it('throws an error if the provider does not suport the flow', () => {
      expect(
        () =>
          new ExternalQuote({
            quote: (mockProviders[1].quote as RawProviderQuote[])[0],
            provider: mockProviders[1],
            flow: CICOFlow.CashOut,
          })
      ).toThrow()
    })
  })
  describe('.getPaymentMethod', () => {
    it('returns PaymentMethod for simplex', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getPaymentMethod()).toEqual(PaymentMethod.Card)
    })
    it('returns PaymentMethod for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getPaymentMethod()).toEqual(PaymentMethod.Bank)
    })
  })

  describe('.getFeeInCrypto', () => {
    it('returns converted fee for simplex', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(3))
    })
    it('returns converted fee for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(2.5))
    })
    it('returns null when fee is unspecified', () => {
      const quote = new ExternalQuote({
        quote: {
          paymentMethod: PaymentMethod.Card,
          digitalAsset: CiCoCurrency.cUSD,
        },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(null)
    })
  })

  describe('.getFeeInFiat', () => {
    it('returns fee for simplex', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(6))
    })
    it('returns fee for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(5))
    })
    it('returns null when fee is unspecified', () => {
      const quote = new ExternalQuote({
        quote: {
          paymentMethod: PaymentMethod.Card,
          digitalAsset: CiCoCurrency.cUSD,
        },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(null)
    })
  })

  describe('.getKycInfo', () => {
    it('returns idRequired', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getKycInfo()).toEqual('selectProviderScreen.idRequired')
    })
  })

  describe('.getTimeEstimation', () => {
    it('returns 1-3 days for Bank', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.X_TO_Y_DAYS,
        lowerBound: 1,
        upperBound: 3,
      })
    })
    it('returns oneHour for Card', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.LESS_THAN_ONE_HOUR,
      })
    })
  })

  describe('.onPress', () => {
    it('returns a function that calls ValoraAnalytics', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      quote.onPress(
        CICOFlow.CashIn,
        createMockStore().dispatch,
        mockProviderSelectionAnalyticsData,
        null
      )()
      expect(ValoraAnalytics.track).toHaveBeenCalled()
    })
  })

  describe('.navigate', () => {
    it('calls navigate for simplex', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      quote.navigate()
      expect(navigate).toHaveBeenCalled()
    })
    it('calls navigateToURI for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      quote.navigate()
      expect(navigateToURI).toHaveBeenCalled()
    })
  })

  describe('.getProviderName', () => {
    it('returns provider name', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getProviderName()).toEqual('Moonpay')
    })
  })

  describe('.getProviderLogo', () => {
    it('returns provider logo', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getProviderLogo()).toEqual(
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media'
      )
    })
  })

  describe('.getProviderId', () => {
    it('returns provider id', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getProviderId()).toEqual('Moonpay')
    })
  })

  describe('.isProviderNew', () => {
    it('returns false', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.isProviderNew()).toEqual(false)
    })
  })

  describe('.getReceiveAmount', () => {
    it('returns amount for simplex quote', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getReceiveAmount()).toEqual(new BigNumber(25))
    })

    it('returns amount for other quotes', () => {
      const quote = new ExternalQuote({
        quote: {
          paymentMethod: PaymentMethod.Bank,
          digitalAsset: CiCoCurrency.CELO,
          returnedAmount: 20,
        },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getReceiveAmount()).toEqual(new BigNumber(20))
    })

    it('returns null if returned amount is not set in quote', () => {
      const quote = new ExternalQuote({
        quote: { paymentMethod: PaymentMethod.Bank, digitalAsset: CiCoCurrency.CELO },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getReceiveAmount()).toBeNull()
    })
  })
})
