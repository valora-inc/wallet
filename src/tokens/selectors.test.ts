import BigNumber from 'bignumber.js'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  defaultTokenToSendSelector,
  swappableTokensSelector,
  tokensByAddressSelector,
  tokensByUsdBalanceSelector,
  tokensListSelector,
  tokensWithUsdValueSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

const mockDate = 1588200517518

jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.10.0',
}))

beforeAll(() => {
  jest.useFakeTimers({ now: mockDate })
})

const state: any = {
  tokens: {
    tokenBalances: {
      ['celo-alfajores:0xusd']: {
        tokenId: 'celo-alfajores:0xusd',
        networkId: NetworkId['celo-alfajores'],
        address: '0xusd',
        balance: '0',
        priceUsd: '1',
        symbol: 'cUSD',
        priceFetchedAt: mockDate,
        isSwappable: true,
      },
      ['celo-alfajores:0xeur']: {
        tokenId: 'celo-alfajores:0xeur',
        networkId: NetworkId['celo-alfajores'],
        address: '0xeur',
        balance: '50',
        priceUsd: '0.5',
        symbol: 'cEUR',
        isSupercharged: true,
        priceFetchedAt: mockDate,
        minimumAppVersionToSwap: '1.0.0',
      },
      ['celo-alfajores:0x1']: {
        tokenId: 'celo-alfajores:0x1',
        networkId: NetworkId['celo-alfajores'],
        address: '0x1',
        balance: '10',
        priceUsd: '10',
        priceFetchedAt: mockDate,
        minimumAppVersionToSwap: '1.20.0',
      },
      ['celo-alfajores:0x2']: {
        tokenId: 'celo-alfajores:0x2',
        networkId: NetworkId['celo-alfajores'],
        address: '0x2',
        priceUsd: '100',
        balance: null,
        priceFetchedAt: mockDate,
      },
      ['celo-alfajores:0x4']: {
        tokenId: 'celo-alfajores:0x4',
        networkId: NetworkId['celo-alfajores'],
        address: '0x4',
        symbol: 'TT',
        balance: '50',
        isSupercharged: true,
        priceFetchedAt: mockDate,
        minimumAppVersionToSwap: '1.10.0',
      },
      ['celo-alfajores:0x5']: {
        tokenId: 'celo-alfajores:0x5',
        networkId: NetworkId['celo-alfajores'],
        address: '0x5',
        balance: '50',
        priceUsd: '500',
        priceFetchedAt: mockDate - 2 * ONE_DAY_IN_MILLIS,
      },
      ['celo-alfajores:0x6']: {
        tokenId: 'celo-alfajores:0x6',
        networkId: NetworkId['celo-alfajores'],
        balance: '50',
        priceUsd: '500',
        priceFetchedAt: mockDate - 2 * ONE_DAY_IN_MILLIS,
      },
    },
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.EUR,
    fetchedCurrencyCode: LocalCurrencyCode.EUR,
    usdToLocalRate: '0.86',
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
      [
        {
          "address": "0x1",
          "balance": "10",
          "lastKnownPriceUsd": "10",
          "minimumAppVersionToSwap": "1.20.0",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "tokenId": "celo-alfajores:0x1",
          "priceUsd": "10",
        },
        {
          "address": "0xeur",
          "balance": "50",
          "isSupercharged": true,
          "lastKnownPriceUsd": "0.5",
          "minimumAppVersionToSwap": "1.0.0",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "symbol": "cEUR",
          "tokenId": "celo-alfajores:0xeur",
          "priceUsd": "0.5",
        },
        {
          "address": "0xusd",
          "balance": "0",
          "isSwappable": true,
          "lastKnownPriceUsd": "1",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "symbol": "cUSD",
          "tokenId": "celo-alfajores:0xusd",
          "priceUsd": "1",
        },
        {
          "address": "0x4",
          "balance": "50",
          "isSupercharged": true,
          "lastKnownPriceUsd": null,
          "minimumAppVersionToSwap": "1.10.0",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "symbol": "TT",
          "tokenId": "celo-alfajores:0x4",
          "priceUsd": null,
        },
        {
          "address": "0x5",
          "balance": "50",
          "lastKnownPriceUsd": "500",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588027717518,
          "tokenId": "celo-alfajores:0x5",
          "priceUsd": null,
        },
      ]
    `)
  })
})

describe('tokensWithUsdValueSelector', () => {
  it('returns only the tokens that have a USD balance', () => {
    const tokens = tokensWithUsdValueSelector(state)
    expect(tokens).toMatchInlineSnapshot(`
      [
        {
          "address": "0x1",
          "balance": "10",
          "lastKnownPriceUsd": "10",
          "minimumAppVersionToSwap": "1.20.0",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "tokenId": "celo-alfajores:0x1",
          "priceUsd": "10",
        },
        {
          "address": "0xeur",
          "balance": "50",
          "isSupercharged": true,
          "lastKnownPriceUsd": "0.5",
          "minimumAppVersionToSwap": "1.0.0",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "symbol": "cEUR",
          "tokenId": "celo-alfajores:0xeur",
          "priceUsd": "0.5",
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

  describe(swappableTokensSelector, () => {
    it('should return the tokens that are swappable', () => {
      expect(swappableTokensSelector(state)).toMatchInlineSnapshot(`
        [
          {
            "address": "0xeur",
            "balance": "50",
            "isSupercharged": true,
            "lastKnownPriceUsd": "0.5",
            "minimumAppVersionToSwap": "1.0.0",
            "networkId": "celo-alfajores",
            "priceFetchedAt": 1588200517518,
            "symbol": "cEUR",
            "tokenId": "celo-alfajores:0xeur",
            "priceUsd": "0.5",
          },
          {
            "address": "0xusd",
            "balance": "0",
            "isSwappable": true,
            "lastKnownPriceUsd": "1",
            "networkId": "celo-alfajores",
            "priceFetchedAt": 1588200517518,
            "symbol": "cUSD",
            "tokenId": "celo-alfajores:0xusd",
            "priceUsd": "1",
          },
          {
            "address": "0x4",
            "balance": "50",
            "isSupercharged": true,
            "lastKnownPriceUsd": null,
            "minimumAppVersionToSwap": "1.10.0",
            "networkId": "celo-alfajores",
            "priceFetchedAt": 1588200517518,
            "symbol": "TT",
            "tokenId": "celo-alfajores:0x4",
            "priceUsd": null,
          },
        ]
      `)
    })
  })
})
