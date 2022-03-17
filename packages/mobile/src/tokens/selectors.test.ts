import BigNumber from 'bignumber.js'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  defaultTokenToSendSelector,
  tokensByAddressSelector,
  tokensByUsdBalanceSelector,
  tokensListSelector,
  tokensWithUsdValueSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

const mockDate = 1588200517518
global.Date.now = jest.fn(() => mockDate)

const state: any = {
  tokens: {
    tokenBalances: {
      ['0xusd']: {
        address: '0xusd',
        balance: '0',
        usdPrice: '1',
        symbol: 'cUSD',
        priceFetchedAt: mockDate,
      },
      ['0xeur']: {
        address: '0xeur',
        balance: '50',
        usdPrice: '0.5',
        symbol: 'cEUR',
        priceFetchedAt: mockDate,
      },
      ['0x1']: {
        address: '0x1',
        balance: '10',
        usdPrice: '10',
        priceFetchedAt: mockDate,
      },
      ['0x3']: {
        address: '0x2',
        usdPrice: '100',
        balance: null,
        priceFetchedAt: mockDate,
      },
      ['0x4']: {
        address: '0x4',
        symbol: 'TT',
        balance: '50',
        priceFetchedAt: mockDate,
      },
      ['0x5']: {
        address: '0x5',
        balance: '50',
        usdPrice: '500',
        priceFetchedAt: mockDate - 2 * ONE_DAY_IN_MILLIS,
      },
    },
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.EUR,
    fetchedCurrencyCode: LocalCurrencyCode.EUR,
    exchangeRates: {
      [Currency.Dollar]: '0.86',
      [Currency.Euro]: null,
      [Currency.Celo]: null,
    },
  },
}

describe(tokensByAddressSelector, () => {
  describe('when fetching tokens by address', () => {
    it('returns the right tokens', () => {
      const tokensByAddress = tokensByAddressSelector(state)
      expect(Object.keys(tokensByAddress).length).toEqual(5)
      expect(tokensByAddress['0xusd']?.symbol).toEqual('cUSD')
      expect(tokensByAddress['0xeur']?.symbol).toEqual('cEUR')
      expect(tokensByAddress['0x4']?.symbol).toEqual('TT')
    })
  })
})

describe(tokensListSelector, () => {
  describe('when fetching tokens as a list', () => {
    it('returns the right tokens', () => {
      const tokens = tokensListSelector(state)
      expect(tokens.length).toEqual(5)
      expect(tokens.find((t) => t.address === '0xusd')?.symbol).toEqual('cUSD')
      expect(tokens.find((t) => t.address === '0xeur')?.symbol).toEqual('cEUR')
      expect(tokens.find((t) => t.address === '0x4')?.symbol).toEqual('TT')
    })
  })
})

describe('tokensByUsdBalanceSelector', () => {
  it('returns the tokens sorted by USD balance in descending order', () => {
    const tokens = tokensByUsdBalanceSelector(state)
    expect(tokens).toMatchInlineSnapshot(`
      Array [
        Object {
          "address": "0x1",
          "balance": "10",
          "priceFetchedAt": 1588200517518,
          "usdPrice": "10",
        },
        Object {
          "address": "0xeur",
          "balance": "50",
          "priceFetchedAt": 1588200517518,
          "symbol": "cEUR",
          "usdPrice": "0.5",
        },
        Object {
          "address": "0xusd",
          "balance": "0",
          "priceFetchedAt": 1588200517518,
          "symbol": "cUSD",
          "usdPrice": "1",
        },
        Object {
          "address": "0x4",
          "balance": "50",
          "priceFetchedAt": 1588200517518,
          "symbol": "TT",
          "usdPrice": null,
        },
        Object {
          "address": "0x5",
          "balance": "50",
          "priceFetchedAt": 1588027717518,
          "usdPrice": null,
        },
      ]
    `)
  })
})

describe('tokensWithUsdValueSelector', () => {
  it('returns only the tokens that have a USD balance', () => {
    const tokens = tokensWithUsdValueSelector(state)
    expect(tokens).toMatchInlineSnapshot(`
      Array [
        Object {
          "address": "0x1",
          "balance": "10",
          "priceFetchedAt": 1588200517518,
          "usdPrice": "10",
        },
        Object {
          "address": "0xeur",
          "balance": "50",
          "priceFetchedAt": 1588200517518,
          "symbol": "cEUR",
          "usdPrice": "0.5",
        },
      ]
    `)
  })
})

describe(defaultTokenToSendSelector, () => {
  describe('when fetching the token with the highest balance', () => {
    it('returns the right token', () => {
      expect(defaultTokenToSendSelector(state)).toEqual('0x1')
    })
  })
})

describe(totalTokenBalanceSelector, () => {
  describe('when fetching the total token balance', () => {
    it('returns the right amount', () => {
      expect(totalTokenBalanceSelector(state)).toEqual(new BigNumber(107.5))
    })

    it('returns null if there was an error fetching and theres no cached info', () => {
      expect(
        totalTokenBalanceSelector({
          ...state,
          tokens: {
            tokenBalances: {},
            error: true,
            loading: false,
          },
        } as any)
      ).toBeNull()
    })
  })
})
