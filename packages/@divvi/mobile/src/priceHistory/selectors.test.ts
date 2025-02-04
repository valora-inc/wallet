import { priceHistoryPricesSelector, priceHistoryStatusSelector } from 'src/priceHistory/selectors'
import { Price } from 'src/priceHistory/slice'

const celoPrices = [
  {
    priceFetchedAt: 1702615273456,
    priceUsd: '0.586264975645369',
  },
  {
    timestamp: 1702619113312,
    price: '0.586264975645369',
  },
] as Price[]

const state: any = {
  priceHistory: {
    ['celo-alfajores:0xusd']: {
      prices: celoPrices,
      status: 'success',
    },
  },
}

describe('Price History Selectors', () => {
  describe('tokenPriceHistorySelector', () => {
    it('returns the right tokens', () => {
      const tokenPriceHistory = priceHistoryPricesSelector(state, 'celo-alfajores:0xusd')
      expect(tokenPriceHistory).toStrictEqual(celoPrices)
    })

    it('avoids unnecessary recomputation', () => {
      const tokenPriceHistory = priceHistoryPricesSelector(state, 'celo-alfajores:0xusd')
      const tokenPriceHistory2 = priceHistoryPricesSelector(state, 'celo-alfajores:0xusd')
      expect(tokenPriceHistory).toEqual(tokenPriceHistory2)
      expect(priceHistoryPricesSelector.recomputations()).toEqual(1)
    })
  })

  describe('tokenPriceHistoryStatusSelector', () => {
    it('returns the right status', () => {
      const tokenPriceHistoryStatus = priceHistoryStatusSelector(state, 'celo-alfajores:0xusd')
      expect(tokenPriceHistoryStatus).toStrictEqual('success')
    })

    it('avoids unnecessary recomputation', () => {
      const tokenPriceHistoryStatus = priceHistoryStatusSelector(state, 'celo-alfajores:0xusd')
      const tokenPriceHistoryStatus2 = priceHistoryStatusSelector(state, 'celo-alfajores:0xusd')
      expect(tokenPriceHistoryStatus).toEqual(tokenPriceHistoryStatus2)
      expect(priceHistoryStatusSelector.recomputations()).toEqual(1)
    })
  })
})
