import BigNumber from 'bignumber.js'
import AppAnalytics from 'src/analytics/AppAnalytics'
import ExternalQuote from 'src/fiatExchanges/quotes/ExternalQuote'
import { SettlementTime } from 'src/fiatExchanges/quotes/constants'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/types'
import { navigate } from 'src/navigator/NavigationService'
import { NetworkId } from 'src/transactions/types'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore } from 'test/utils'
import {
  mockCicoQuotes,
  mockCusdAddress,
  mockCusdTokenId,
  mockProviderSelectionAnalyticsData,
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
  describe('.getPaymentMethod', () => {
    it('returns PaymentMethod', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.getPaymentMethod()).toEqual(PaymentMethod.Bank)
    })
  })

  describe('.getFeeInCrypto', () => {
    it('returns converted fee', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(2.5))
    })
    it('returns null when fee is unspecified', () => {
      const quote = new ExternalQuote({ ...mockCicoQuotes[1], fiatFee: undefined })
      expect(quote.getFeeInCrypto(mockUsdToLocalRate, mockTokenInfo)).toEqual(null)
    })
  })

  describe('.getFeeInFiat', () => {
    it('returns fee for other', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(new BigNumber(5))
    })
    it('returns null when fee is unspecified', () => {
      const quote = new ExternalQuote({ ...mockCicoQuotes[1], fiatFee: undefined })
      expect(quote.getFeeInFiat(mockUsdToLocalRate, mockTokenInfo)).toEqual(null)
    })
  })

  describe('.getKycInfo', () => {
    it('returns idRequired', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.getKycInfo()).toEqual('selectProviderScreen.idRequired')
    })
  })

  describe('.getTimeEstimation', () => {
    it('returns 1-3 days for Bank', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.X_TO_Y_DAYS,
        lowerBound: 1,
        upperBound: 3,
      })
    })
    it('returns oneHour for Card', () => {
      const quote = new ExternalQuote(mockCicoQuotes[0])
      expect(quote.getTimeEstimation()).toEqual({
        settlementTime: SettlementTime.LESS_THAN_ONE_HOUR,
      })
    })
  })

  describe('.onPress', () => {
    it('returns a function that calls AppAnalytics', () => {
      const quote = new ExternalQuote(mockCicoQuotes[0])
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
      const quote = new ExternalQuote(mockCicoQuotes[0])
      quote.navigate()
      expect(navigate).toHaveBeenCalled()
    })
    it('calls navigateToURI for other', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      quote.navigate()
      expect(navigateToURI).toHaveBeenCalledWith('https://www.moonpay.com/')
    })
  })

  describe('.getProviderName', () => {
    it('returns provider name', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.getProviderName()).toEqual('Moonpay')
    })
  })

  describe('.getProviderLogo', () => {
    it('returns provider logo', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.getProviderLogo()).toEqual(
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media'
      )
    })
  })

  describe('.getProviderId', () => {
    it('returns provider id', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.getProviderId()).toEqual('Moonpay')
    })
  })

  describe('.isProviderNew', () => {
    it('returns false', () => {
      const quote = new ExternalQuote(mockCicoQuotes[1])
      expect(quote.isProviderNew()).toEqual(false)
    })
  })

  describe('.getReceiveAmount', () => {
    it('returns amount for cash in', () => {
      const quote = new ExternalQuote(mockCicoQuotes[0])
      expect(quote.getReceiveAmount()).toEqual(new BigNumber(25))
    })

    it('returns amount for cash out', () => {
      const quote = new ExternalQuote({ ...mockCicoQuotes[1], txType: 'cashOut' })
      expect(quote.getReceiveAmount()).toEqual(new BigNumber(100))
    })

    it('returns null if crypto amount is not set in cash in quote', () => {
      const quote = new ExternalQuote({ ...mockCicoQuotes[0], cryptoAmount: undefined as any })
      expect(quote.getReceiveAmount()).toBeNull()
    })

    it('returns null if fiat amount is not set in cash out quote', () => {
      const quote = new ExternalQuote({
        ...mockCicoQuotes[0],
        fiatAmount: undefined as any,
        txType: 'cashOut',
      })
      expect(quote.getReceiveAmount()).toBeNull()
    })
  })
})
