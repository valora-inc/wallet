import { defaultTokenSelector } from 'src/tokens/selectors'

describe(defaultTokenSelector, () => {
  describe('when fetching the token with the highest balance', () => {
    it('returns the right token', () => {
      const state: any = {
        tokens: {
          tokenBalances: {
            ['usd']: {
              address: 'usd',
              balance: 0,
              usdPrice: 1,
              symbol: 'cUSD',
            },
            ['0x0']: {
              address: '0x0',
              balance: 50,
              usdPrice: 0.5,
            },
            ['0x1']: {
              address: '0x1',
              balance: 10,
              usdPrice: 10,
            },
            ['0x2']: {
              address: '0x2',
              balance: 100,
            },
          },
        },
      }
      expect(defaultTokenSelector(state)).toEqual('0x1')
    })
  })
})
