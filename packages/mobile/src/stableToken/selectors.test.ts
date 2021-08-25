import { higherBalanceStableCurrencySelector } from 'src/stableToken/selectors'

describe('higherBalanceStableCurrencySelector', () => {
  describe('when local exchange rates have been fetched', () => {
    it('should return the currency with the higher balance in the local currency', () => {
      const state: any = {
        stableToken: {
          balances: {
            cUSD: '1',
            cEUR: '1',
          },
        },
        goldToken: { balance: '1' },
        localCurrency: {
          exchangeRates: {
            cUSD: '1',
            cEUR: '2',
            cGLD: '3',
          },
          fetchedCurrencyCode: 'cUSD',
          preferredCurrencyCode: 'cUSD',
        },
      }
      // cEUR has the higher balance in the local currency
      expect(higherBalanceStableCurrencySelector(state)).toEqual('cEUR')
    })

    it('should fallback to cUSD when balances have not been fetched', () => {
      const state: any = {
        stableToken: {
          balances: {
            cUSD: null,
            cEUR: null,
          },
        },
        goldToken: { balance: null },
        localCurrency: {
          exchangeRates: {
            cUSD: '1',
            cEUR: '2',
            cGLD: '3',
          },
          fetchedCurrencyCode: 'cUSD',
          preferredCurrencyCode: 'cUSD',
        },
      }
      expect(higherBalanceStableCurrencySelector(state)).toEqual('cUSD')
    })
  })

  describe('when no local exchange rates have been fetched', () => {
    it('should fallback to cUSD', () => {
      const state: any = {
        stableToken: {
          balances: {
            cUSD: '1',
            cEUR: '1',
          },
        },
        goldToken: { balance: '1' },
        localCurrency: {
          exchangeRates: {
            cUSD: null,
            cEUR: null,
          },
          fetchedCurrencyCode: undefined,
          preferredCurrencyCode: 'cUSD',
        },
      }
      expect(higherBalanceStableCurrencySelector(state)).toEqual('cUSD')
    })
  })
})
