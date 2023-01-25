import { FiatAccountType, FiatType, KycSchema } from '@fiatconnect/fiatconnect-types'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { Currency } from 'src/utils/currencies'
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
        cryptoType: Currency.Celo,
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
    const mockCacheTransferParams = {
      txHash: '0x123',
      transferId: 'transferId12345',
      fiatAccountId: 'account0123',
      quote: transferOutFcQuote,
    }
    it('should handle initially empty state', () => {
      expect(reducer(initialState, cacheFiatConnectTransfer(mockCacheTransferParams))).toEqual({
        ...initialState,
        cachedTransfers: [mockCacheTransferParams],
      })
    })
    it('should handle caching multiple transfers', () => {
      const updatedState = reducer(initialState, cacheFiatConnectTransfer(mockCacheTransferParams))
      expect(reducer(updatedState, cacheFiatConnectTransfer(mockCacheTransferParams))).toEqual({
        ...initialState,
        cachedTransfers: [mockCacheTransferParams, mockCacheTransferParams],
      })
    })
  })
})
