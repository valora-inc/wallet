import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ExternalQuote from 'src/fiatExchanges/quotes/ExternalQuote'
import { CICOFlow, PaymentMethod, RawProviderQuote, SimplexQuote } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { navigateToURI } from 'src/utils/linking'
import { mockProviders } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

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

  describe('.getFee', () => {
    it('returns fee for simplex', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getFee()).toEqual(-13)
    })
    it('returns fee for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getFee()).toEqual(5)
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
    it('returns numDays for Bank', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getTimeEstimation()).toEqual('selectProviderScreen.numDays')
    })
    it('returns oneHour for Card', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      expect(quote.getTimeEstimation()).toEqual('selectProviderScreen.oneHour')
    })
  })

  describe('.onPress', () => {
    it('returns a function that calls ValoraAnalytics', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
      })
      quote.onPress(CICOFlow.CashIn)()
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
})
