import BigNumber from 'bignumber.js'
import AppAnalytics from 'src/analytics/AppAnalytics'
import ExternalQuote from 'src/fiatExchanges/quotes/ExternalQuote'
import { SettlementTime } from 'src/fiatExchanges/quotes/constants'
import { CICOFlow, PaymentMethod, RawProviderQuote, SimplexQuote } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { NetworkId } from 'src/transactions/types'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore } from 'test/utils'
import {
  mockCusdAddress,
  mockCusdTokenId,
  mockProviderSelectionAnalyticsData,
  mockProviders,
} from 'test/values'

jest.mock('src/analytics/AppAnalytics')

const mockUsdToLocalRate = '2'

const mockTokenInfo = {
  balance: new BigNumber('10'),
  priceUsd: new BigNumber('1'),
  lastKnownPriceUsd: new BigNumber('1'),
  symbol: 'cUSD',
  address: mockCusdAddress,
  tokenId: mockCusdTokenId,
  networkId: NetworkId['celo-alfajores'],
  isFeeCurrency: true,
  canTransferWithComment: true,
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
            tokenId: mockCusdTokenId,
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
            tokenId: mockCusdTokenId,
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
            tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
      })
      expect(quote.getPaymentMethod()).toEqual(PaymentMethod.Card)
    })
    it('returns PaymentMethod for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(3))
    })
    it('returns converted fee for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(2.5))
    })
    it('returns null when fee is unspecified', () => {
      const quote = new ExternalQuote({
        quote: {
          paymentMethod: PaymentMethod.Card,
          digitalAsset: 'cUSD',
        },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(6))
    })
    it('returns fee for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(5))
    })
    it('returns null when fee is unspecified', () => {
      const quote = new ExternalQuote({
        quote: {
          paymentMethod: PaymentMethod.Card,
          digitalAsset: 'cUSD',
        },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
      })
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.LESS_THAN_ONE_HOUR,
      })
    })
  })

  describe('.onPress', () => {
    it('returns a function that calls AppAnalytics', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
      })
      quote.onPress(
        CICOFlow.CashIn,
        createMockStore().dispatch,
        mockProviderSelectionAnalyticsData,
        null
      )()
      expect(AppAnalytics.track).toHaveBeenCalled()
    })
  })

  describe('.navigate', () => {
    it('calls navigate for simplex', () => {
      const quote = new ExternalQuote({
        quote: mockProviders[0].quote as SimplexQuote,
        provider: mockProviders[0],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
      })
      quote.navigate()
      expect(navigate).toHaveBeenCalled()
    })
    it('calls navigateToURI for other', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
      })
      quote.navigate()
      expect(navigateToURI).toHaveBeenCalledWith('https://www.moonpay.com/')
    })
    it('calls navigateToURI with quote specific url', () => {
      const quote = new ExternalQuote({
        quote: {
          ...(mockProviders[1].quote as RawProviderQuote[])[0],
          url: 'https://example.com',
        },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
      })
      quote.navigate()
      expect(navigateToURI).toHaveBeenCalledWith('https://example.com')
    })
  })

  describe('.getProviderName', () => {
    it('returns provider name', () => {
      const quote = new ExternalQuote({
        quote: (mockProviders[1].quote as RawProviderQuote[])[0],
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
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
        tokenId: mockCusdTokenId,
      })
      expect(quote.getReceiveAmount()).toEqual(new BigNumber(25))
    })

    it('returns amount for other quotes', () => {
      const quote = new ExternalQuote({
        quote: {
          paymentMethod: PaymentMethod.Bank,
          digitalAsset: 'CELO',
          returnedAmount: 20,
        },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getReceiveAmount()).toEqual(new BigNumber(20))
    })

    it('returns null if returned amount is not set in quote', () => {
      const quote = new ExternalQuote({
        quote: {
          paymentMethod: PaymentMethod.Bank,
          digitalAsset: 'CELO',
        },
        provider: mockProviders[1],
        flow: CICOFlow.CashIn,
        tokenId: mockCusdTokenId,
      })
      expect(quote.getReceiveAmount()).toBeNull()
    })
  })
})
