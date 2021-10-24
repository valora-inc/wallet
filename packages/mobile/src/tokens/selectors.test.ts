import {
  defaultTokenSelector,
  tokensByAddressSelector,
  tokensListSelector,
} from 'src/tokens/selectors'

const state: any = {
  tokens: {
    tokenBalances: {
      ['0xusd']: {
        address: '0xusd',
        balance: '0',
        usdPrice: '1',
        symbol: 'cUSD',
      },
      ['0xeur']: {
        address: '0xeur',
        balance: '50',
        usdPrice: '0.5',
        symbol: 'cEUR',
      },
      ['0x1']: {
        address: '0x1',
        balance: '10',
        usdPrice: '10',
      },
      ['0x2']: {
        address: '0x2',
        balance: '100',
      },
      ['0x3']: {
        address: '0x2',
        usdPrice: '100',
      },
    },
  },
}

describe(tokensByAddressSelector, () => {
  describe('when fetching tokens by address', () => {
    it('returns the right tokens', () => {
      const tokensByAddress = tokensByAddressSelector(state)
      expect(Object.keys(tokensByAddress).length).toEqual(3)
      expect(tokensByAddress['0xusd']?.symbol).toEqual('cUSD')
      expect(tokensByAddress['0xeur']?.symbol).toEqual('cEUR')
    })
  })
})

describe(tokensListSelector, () => {
  describe('when fetching tokens as a list', () => {
    it('returns the right tokens', () => {
      const tokens = tokensListSelector(state)
      expect(tokens.length).toEqual(3)
      expect(tokens.find((t) => t.address === '0xusd')?.symbol).toEqual('cUSD')
      expect(tokens.find((t) => t.address === '0xeur')?.symbol).toEqual('cEUR')
    })
  })
})

describe(defaultTokenSelector, () => {
  describe('when fetching the token with the highest balance', () => {
    it('returns the right token', () => {
      expect(defaultTokenSelector(state)).toEqual('0x1')
    })
  })
})
