import { FiatAccountType, FiatType, KycSchema } from '@fiatconnect/fiatconnect-types'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { CiCoCurrency } from 'src/utils/currencies'
import { mockFiatConnectQuotes } from 'test/values'
import reducer, { cacheFiatConnectTransfer, cacheQuoteParams, initialState, State } from './slice'

describe('fiatconnect slices', () => {
  describe('cacheQuoteParams', () => {
    it('should handle initially empty state', () => {
      const previousState = {
        cachedQuoteParams: {},
      }
      const mockCacheQuoteParams = {
        cryptoAmount: '100',
        fiatAmount: '100',
        flow: CICOFlow.CashOut,
        cryptoType: CiCoCurrency.CELO,
        fiatType: FiatType.USD,
      }
      expect(
        reducer(
          previousState as State,
          cacheQuoteParams({
            providerId: 'provider',
            kycSchema: KycSchema.PersonalDataAndDocuments,
            cachedQuoteParams: mockCacheQuoteParams,
          })
        )
      ).toEqual({
        cachedQuoteParams: {
          provider: {
            [KycSchema.PersonalDataAndDocuments]: mockCacheQuoteParams,
          },
        },
      })
    })
  })
  describe('cacheFiatConnectTransfer', () => {
    const transferOutFcQuote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
    })
    const txHash1 = '0x123'
    const txHash2 = '0x456'
    const mockCachedTransfer = {
      transferId: 'transferId12345',
      fiatAccountId: 'account0123',
      providerId: transferOutFcQuote.getProviderId(),
      quote: transferOutFcQuote.quote.quote,
    }
    it('should handle initially empty state', () => {
      expect(
        reducer(initialState, cacheFiatConnectTransfer({ ...mockCachedTransfer, txHash: txHash1 }))
      ).toEqual({
        ...initialState,
        cachedTransfers: { [txHash1]: mockCachedTransfer },
      })
    })
    it('should handle caching multiple transfers', () => {
      const updatedState = reducer(
        initialState,
        cacheFiatConnectTransfer({ ...mockCachedTransfer, txHash: txHash1 })
      )
      expect(
        reducer(updatedState, cacheFiatConnectTransfer({ ...mockCachedTransfer, txHash: txHash2 }))
      ).toEqual({
        ...initialState,
        cachedTransfers: {
          [txHash1]: mockCachedTransfer,
          [txHash2]: mockCachedTransfer,
        },
      })
    })
  })
})
