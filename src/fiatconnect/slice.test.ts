import { FiatType, KycSchema } from '@fiatconnect/fiatconnect-types'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { Currency } from 'src/utils/currencies'
import reducer, { cacheQuoteParams, State } from './slice'

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
})
