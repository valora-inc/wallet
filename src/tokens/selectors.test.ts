import BigNumber from 'bignumber.js'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getFeatureGate } from 'src/statsig'
import {
  _feeCurrenciesByNetworkIdSelector,
  cashInTokensByNetworkIdSelector,
  cashOutTokensByNetworkIdSelector,
  feeCurrenciesSelector,
  feeCurrenciesWithPositiveBalancesSelector,
  importedTokensSelector,
  lastKnownTokenBalancesSelector,
  sortedTokensWithBalanceOrShowZeroBalanceSelector,
  sortedTokensWithBalanceSelector,
  spendTokensByNetworkIdSelector,
  swappableFromTokensByNetworkIdSelector,
  swappableToTokensByNetworkIdSelector,
  tokensByAddressSelector,
  tokensByIdSelector,
  tokensByUsdBalanceSelector,
  tokensListSelector,
  tokensListWithAddressSelector,
  tokensWithUsdValueSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { mockCeloTokenId, mockEthTokenId, mockTokenBalances } from 'test/values'

const mockDate = 1588200517518

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
      spendTokenIds: ['celo-alfajores:0xusd', 'celo-alfajores:0xeur'],
    },
  }
})

jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.10.0',
}))

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
}))

beforeAll(() => {
  jest.useFakeTimers({ now: mockDate })
})

beforeEach(() => {
  jest.mocked(getFeatureGate).mockReturnValue(true)
})

const state: any = {
  tokens: {
    tokenBalances: {
      ['celo-alfajores:0xusd']: {
        tokenId: 'celo-alfajores:0xusd',
        networkId: NetworkId['celo-alfajores'],
        name: 'cUSD',
        address: '0xusd',
        balance: '0',
        priceUsd: '1',
        symbol: 'cUSD',
        priceFetchedAt: mockDate,
        isSwappable: true,
        showZeroBalance: true,
        isCashInEligible: true,
        isCashOutEligible: true,
      },
      ['celo-alfajores:0xeur']: {
        tokenId: 'celo-alfajores:0xeur',
        networkId: NetworkId['celo-alfajores'],
        name: 'cEUR',
        address: '0xeur',
        balance: '50',
        priceUsd: '0.5',
        symbol: 'cEUR',
        isSupercharged: true,
        priceFetchedAt: mockDate,
        minimumAppVersionToSwap: '1.0.0',
        isCashInEligible: true,
        isCashOutEligible: true,
      },
      ['celo-alfajores:0x1']: {
        tokenId: 'celo-alfajores:0x1',
        networkId: NetworkId['celo-alfajores'],
        name: '0x1 token',
        bridge: 'somebridge',
        address: '0x1',
        balance: '10',
        priceUsd: '10',
        priceFetchedAt: mockDate,
        minimumAppVersionToSwap: '1.20.0',
        isCashInEligible: true,
        isCashOutEligible: true,
      },
      ['celo-alfajores:0x2']: {
        tokenId: 'celo-alfajores:0x2',
        networkId: NetworkId['celo-alfajores'],
        name: '0x2 token',
        address: '0x2',
        priceUsd: '100',
        balance: null,
        priceFetchedAt: mockDate,
        minimumAppVersionToSwap: '1.10.0',
      },
      ['celo-alfajores:0x4']: {
        tokenId: 'celo-alfajores:0x4',
        networkId: NetworkId['celo-alfajores'],
        name: '0x4 token',
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
        name: '0x5 token',
        address: '0x5',
        balance: '50',
        priceUsd: '500',
        priceFetchedAt: mockDate - 2 * ONE_DAY_IN_MILLIS, // stale price
        minimumAppVersionToSwap: '1.10.0',
      },
      ['celo-alfajores:0x6']: {
        name: '0x6 token',
        tokenId: 'celo-alfajores:0x6',
        networkId: NetworkId['celo-alfajores'],
        balance: '0',
        priceUsd: null,
        priceFetchedAt: mockDate,
        minimumAppVersionToSwap: '1.10.0',
      },
      ['ethereum-sepolia:0x7']: {
        name: '0x7 token',
        tokenId: 'ethereum-sepolia:0x7',
        networkId: NetworkId['ethereum-sepolia'],
        balance: '50',
        priceUsd: '500',
        priceFetchedAt: mockDate - 2 * ONE_DAY_IN_MILLIS, // stale price
        minimumAppVersionToSwap: '1.10.0',
      },
      [mockEthTokenId]: {
        name: 'Ether',
        tokenId: mockEthTokenId,
        networkId: NetworkId['ethereum-sepolia'],
        balance: '0',
        priceUsd: '500',
        priceFetchedAt: mockDate,
        showZeroBalance: true,
        isNative: true,
        minimumAppVersionToSwap: '1.10.0',
      },
    },
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.EUR,
    fetchedCurrencyCode: LocalCurrencyCode.EUR,
    usdToLocalRate: '0.86',
  },
}

describe(tokensByIdSelector, () => {
  describe('when fetching tokens by id', () => {
    it('returns the right tokens', () => {
      const tokensById = tokensByIdSelector(state, [NetworkId['celo-alfajores']])
      expect(Object.keys(tokensById).length).toEqual(6)
      expect(tokensById['celo-alfajores:0xusd']?.symbol).toEqual('cUSD')
      expect(tokensById['celo-alfajores:0xeur']?.symbol).toEqual('cEUR')
      expect(tokensById['celo-alfajores:0x4']?.symbol).toEqual('TT')
      expect(tokensById['celo-alfajores:0x1']?.name).toEqual('0x1 token')
      expect(tokensById['celo-alfajores:0x5']?.name).toEqual('0x5 token')
      expect(tokensById['celo-alfajores:0x6']?.name).toEqual('0x6 token')
    })
    it('avoids unnecessary recomputation', () => {
      const tokensById = tokensByIdSelector(state, [NetworkId['celo-alfajores']])
      const tokensByIdSepolia = tokensByIdSelector(state, [NetworkId['ethereum-sepolia']])
      const tokensById2 = tokensByIdSelector(state, [NetworkId['celo-alfajores']])

      expect(tokensByIdSepolia).not.toEqual(tokensById)
      expect(tokensById).toEqual(tokensById2)
      expect(tokensByIdSelector.recomputations()).toEqual(2) // once for each different networkId
    })
  })
})

describe(tokensByAddressSelector, () => {
  describe('when fetching tokens by address', () => {
    it('returns the right tokens', () => {
      const tokensByAddress = tokensByAddressSelector(state)
      expect(Object.keys(tokensByAddress).length).toEqual(5)
      expect(tokensByAddress['0xusd']?.symbol).toEqual('cUSD')
      expect(tokensByAddress['0xeur']?.symbol).toEqual('cEUR')
      expect(tokensByAddress['0x4']?.symbol).toEqual('TT')
      expect(tokensByAddress['0x1']?.name).toEqual('0x1 token (somebridge)')
      expect(tokensByAddress['0x5']?.name).toEqual('0x5 token')
    })
  })
})

describe(tokensListSelector, () => {
  describe('when fetching tokens with id as a list', () => {
    it('returns the right tokens', () => {
      const tokens = tokensListSelector(state, [
        NetworkId['celo-alfajores'],
        NetworkId['ethereum-sepolia'],
      ])
      expect(tokens.length).toEqual(8)
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xusd')?.symbol).toEqual('cUSD')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xeur')?.symbol).toEqual('cEUR')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0x4')?.symbol).toEqual('TT')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0x1')?.name).toEqual('0x1 token')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0x5')?.name).toEqual('0x5 token')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0x6')?.name).toEqual('0x6 token')
      expect(tokens.find((t) => t.tokenId === 'ethereum-sepolia:0x7')?.name).toEqual('0x7 token')
      expect(tokens.find((t) => t.tokenId === mockEthTokenId)?.name).toEqual('Ether')
    })
  })
})

describe(tokensListWithAddressSelector, () => {
  describe('when fetching tokens with address as a list', () => {
    it('returns the right tokens', () => {
      const tokens = tokensListWithAddressSelector(state)
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
          "bridge": "somebridge",
          "isCashInEligible": true,
          "isCashOutEligible": true,
          "lastKnownPriceUsd": "10",
          "minimumAppVersionToSwap": "1.20.0",
          "name": "0x1 token (somebridge)",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "priceUsd": "10",
          "tokenId": "celo-alfajores:0x1",
        },
        {
          "address": "0xeur",
          "balance": "50",
          "isCashInEligible": true,
          "isCashOutEligible": true,
          "isSupercharged": true,
          "lastKnownPriceUsd": "0.5",
          "minimumAppVersionToSwap": "1.0.0",
          "name": "cEUR",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "priceUsd": "0.5",
          "symbol": "cEUR",
          "tokenId": "celo-alfajores:0xeur",
        },
        {
          "address": "0xusd",
          "balance": "0",
          "isCashInEligible": true,
          "isCashOutEligible": true,
          "isSwappable": true,
          "lastKnownPriceUsd": "1",
          "name": "cUSD",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "priceUsd": "1",
          "showZeroBalance": true,
          "symbol": "cUSD",
          "tokenId": "celo-alfajores:0xusd",
        },
        {
          "address": "0x4",
          "balance": "50",
          "isSupercharged": true,
          "lastKnownPriceUsd": null,
          "minimumAppVersionToSwap": "1.10.0",
          "name": "0x4 token",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "priceUsd": null,
          "symbol": "TT",
          "tokenId": "celo-alfajores:0x4",
        },
        {
          "address": "0x5",
          "balance": "50",
          "lastKnownPriceUsd": "500",
          "minimumAppVersionToSwap": "1.10.0",
          "name": "0x5 token",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588027717518,
          "priceUsd": null,
          "tokenId": "celo-alfajores:0x5",
        },
      ]
    `)
  })
})

describe('tokensWithUsdValueSelector', () => {
  it('returns only the tokens that have a USD balance', () => {
    const tokens = tokensWithUsdValueSelector(state, [NetworkId['celo-alfajores']])
    expect(tokens).toMatchInlineSnapshot(`
      [
        {
          "address": "0xeur",
          "balance": "50",
          "isCashInEligible": true,
          "isCashOutEligible": true,
          "isSupercharged": true,
          "lastKnownPriceUsd": "0.5",
          "minimumAppVersionToSwap": "1.0.0",
          "name": "cEUR",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "priceUsd": "0.5",
          "symbol": "cEUR",
          "tokenId": "celo-alfajores:0xeur",
        },
        {
          "address": "0x1",
          "balance": "10",
          "bridge": "somebridge",
          "isCashInEligible": true,
          "isCashOutEligible": true,
          "lastKnownPriceUsd": "10",
          "minimumAppVersionToSwap": "1.20.0",
          "name": "0x1 token",
          "networkId": "celo-alfajores",
          "priceFetchedAt": 1588200517518,
          "priceUsd": "10",
          "tokenId": "celo-alfajores:0x1",
        },
      ]
    `)
  })
})

describe(totalTokenBalanceSelector, () => {
  describe('when fetching the total token balance', () => {
    it('returns the right amount', () => {
      expect(totalTokenBalanceSelector(state, [NetworkId['celo-alfajores']])).toEqual(
        new BigNumber(107.5)
      )
    })

    it('returns null if there was an error fetching and theres no cached info', () => {
      const errorState = {
        ...state,
        tokens: {
          tokenBalances: {},
          error: true,
          loading: false,
        },
      } as any
      expect(totalTokenBalanceSelector(errorState, [NetworkId['celo-alfajores']])).toBeNull()
    })
  })
})

describe('sortedTokensWithBalanceSelector', () => {
  it('returns expected tokens in the correct order without zero balances', () => {
    const tokens = sortedTokensWithBalanceSelector(state, [
      NetworkId['celo-alfajores'],
      NetworkId['ethereum-sepolia'],
    ])

    expect(tokens.map((token) => token.tokenId)).toEqual([
      'celo-alfajores:0x1',
      'celo-alfajores:0xeur',
      'celo-alfajores:0x4',
      'celo-alfajores:0x5',
      'ethereum-sepolia:0x7',
    ])
  })

  it('avoids unnecessary recomputation', () => {
    const prevComputations = sortedTokensWithBalanceSelector.recomputations()
    const tokens = sortedTokensWithBalanceSelector(state, [NetworkId['celo-alfajores']])
    const tokens2 = sortedTokensWithBalanceSelector(state, [NetworkId['celo-alfajores']])
    expect(tokens).toEqual(tokens2)
    expect(sortedTokensWithBalanceOrShowZeroBalanceSelector.recomputations()).toEqual(
      prevComputations + 1
    )
  })
})

describe('sortedTokensWithBalanceOrShowZeroBalanceSelector', () => {
  it('returns expected tokens in the correct order including show zero balances', () => {
    const tokens = sortedTokensWithBalanceOrShowZeroBalanceSelector(state, [
      NetworkId['celo-alfajores'],
      NetworkId['ethereum-sepolia'],
    ])

    expect(tokens.map((token) => token.tokenId)).toEqual([
      'celo-alfajores:0x1',
      'celo-alfajores:0xeur',
      'celo-alfajores:0x4',
      'celo-alfajores:0x5',
      'ethereum-sepolia:0x7',
      'ethereum-sepolia:native',
      'celo-alfajores:0xusd',
    ])
  })

  it('avoids unnecessary recomputation', () => {
    const prevComputations = sortedTokensWithBalanceOrShowZeroBalanceSelector.recomputations()
    const tokens = sortedTokensWithBalanceOrShowZeroBalanceSelector(state, [
      NetworkId['celo-alfajores'],
    ])
    const tokens2 = sortedTokensWithBalanceOrShowZeroBalanceSelector(state, [
      NetworkId['celo-alfajores'],
    ])
    expect(tokens).toEqual(tokens2)
    expect(sortedTokensWithBalanceOrShowZeroBalanceSelector.recomputations()).toEqual(
      prevComputations + 1
    )
  })
})

describe(cashInTokensByNetworkIdSelector, () => {
  describe('when fetching cash in tokens', () => {
    it('returns the right tokens when isCicoToken check not used', () => {
      const tokens = cashInTokensByNetworkIdSelector(state, [
        NetworkId['celo-alfajores'],
        NetworkId['ethereum-sepolia'],
      ])
      expect(tokens.length).toEqual(3)
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xusd')?.symbol).toEqual('cUSD')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xeur')?.symbol).toEqual('cEUR')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0x1')?.name).toEqual('0x1 token')
    })
  })
})

describe(cashOutTokensByNetworkIdSelector, () => {
  describe('when fetching cash out tokens', () => {
    it('returns the right tokens without zero balance included when isCicoToken check not used', () => {
      const tokens = cashOutTokensByNetworkIdSelector(
        state,
        [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
        false
      )
      expect(tokens.length).toEqual(2)
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xeur')?.symbol).toEqual('cEUR')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0x1')?.name).toEqual('0x1 token')
    })
    it('returns the right tokens with zero balance included when isCicoToken check not used', () => {
      const tokens = cashOutTokensByNetworkIdSelector(
        state,
        [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
        true
      )
      expect(tokens.length).toEqual(3)
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xusd')?.symbol).toEqual('cUSD')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xeur')?.symbol).toEqual('cEUR')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0x1')?.name).toEqual('0x1 token')
    })
  })
})

describe(spendTokensByNetworkIdSelector, () => {
  describe('when fetching spend tokens', () => {
    it('returns the right tokens', () => {
      const tokens = spendTokensByNetworkIdSelector(state, [
        NetworkId['celo-alfajores'],
        NetworkId['ethereum-sepolia'],
      ])
      expect(tokens.length).toEqual(2)
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xusd')?.symbol).toEqual('cUSD')
      expect(tokens.find((t) => t.tokenId === 'celo-alfajores:0xeur')?.symbol).toEqual('cEUR')
    })
  })
})

describe('feeCurrenciesSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockState: any = {
    tokens: {
      tokenBalances: {
        ...state.tokens.tokenBalances,
        ['celo-alfajores:0xusd']: {
          ...state.tokens.tokenBalances['celo-alfajores:0xusd'],
          isFeeCurrency: true,
          balance: '200',
        },
        ['celo-alfajores:0xeur']: {
          ...state.tokens.tokenBalances['celo-alfajores:0xeur'],
          isFeeCurrency: true,
          balance: '0',
        },
        [mockCeloTokenId]: {
          ...mockTokenBalances[mockCeloTokenId],
          isFeeCurrency: true,
          isNative: true,
          balance: '200',
        },
        [mockEthTokenId]: {
          ...state.tokens.tokenBalances[mockEthTokenId],
          isNative: true,
          balance: '200',
        },
      },
    },
  }

  it('returns feeCurrencies sorted by native currency first, then by USD balance, and balance otherwise', () => {
    const result = feeCurrenciesSelector(mockState, NetworkId['celo-alfajores'])

    expect(result.map((currency) => currency.tokenId)).toEqual([
      mockCeloTokenId,
      'celo-alfajores:0xusd',
      'celo-alfajores:0xeur',
    ])
  })

  it('avoids unnecessary recomputations for calculating fee currencies', () => {
    const resultAlfajores = feeCurrenciesSelector(mockState, NetworkId['celo-alfajores'])
    const resultSepolia = feeCurrenciesSelector(mockState, NetworkId['ethereum-sepolia'])
    const resultAlfajores2 = feeCurrenciesSelector(mockState, NetworkId['celo-alfajores'])

    expect(resultAlfajores).toEqual(resultAlfajores2)
    expect(resultAlfajores).not.toEqual(resultSepolia)
    expect(_feeCurrenciesByNetworkIdSelector.recomputations()).toEqual(1)
  })
})

describe('feeCurrenciesWithPositiveBalancesSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockState: any = {
    tokens: {
      tokenBalances: {
        ...state.tokens.tokenBalances,
        ['celo-alfajores:0xusd']: {
          ...state.tokens.tokenBalances['celo-alfajores:0xusd'],
          isFeeCurrency: true,
          balance: '200',
        },
        ['celo-alfajores:0xeur']: {
          ...state.tokens.tokenBalances['celo-alfajores:0xeur'],
          isFeeCurrency: true,
          balance: '0',
        },
        [mockCeloTokenId]: {
          ...mockTokenBalances[mockCeloTokenId],
          isFeeCurrency: true,
          isNative: true,
          balance: '200',
        },
        [mockEthTokenId]: {
          ...state.tokens.tokenBalances[mockEthTokenId],
          isNative: true,
          balance: '200',
        },
      },
    },
  }

  it('returns the same as feeCurrenciesSelector but only with positive balances', () => {
    const result = feeCurrenciesWithPositiveBalancesSelector(mockState, NetworkId['celo-alfajores'])

    expect(result.map((currency) => currency.tokenId)).toEqual([
      mockCeloTokenId,
      'celo-alfajores:0xusd',
    ])
  })

  it('avoids unnecessary recomputations for calculating fee currencies', () => {
    const resultAlfajores = feeCurrenciesWithPositiveBalancesSelector(
      mockState,
      NetworkId['celo-alfajores']
    )
    const resultSepolia = feeCurrenciesWithPositiveBalancesSelector(
      mockState,
      NetworkId['ethereum-sepolia']
    )
    const resultAlfajores2 = feeCurrenciesWithPositiveBalancesSelector(
      mockState,
      NetworkId['celo-alfajores']
    )

    expect(resultAlfajores).toBe(resultAlfajores2)
    expect(resultAlfajores).not.toBe(resultSepolia)
    expect(feeCurrenciesWithPositiveBalancesSelector.recomputations()).toEqual(2)
  })
})

describe('lastKnownTokenBalancesSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockState: any = {
    ...state,
    tokens: {
      tokenBalances: {
        ...state.tokens.tokenBalances,
        ['celo-alfajores:0xusd']: {
          ...state.tokens.tokenBalances['celo-alfajores:0xusd'],
          balance: '200',
          lastKnownPriceUsd: '1',
        },
        ['celo-alfajores:0x1']: {
          ...state.tokens.tokenBalances['celo-alfajores:0x1'],
          balance: '0',
        },
        ['celo-alfajores:0x5']: {
          ...state.tokens.tokenBalances['celo-alfajores:0x5'],
          balance: '0',
        },
        ['celo-alfajores:0x6']: {
          ...state.tokens.tokenBalances['celo-alfajores:0x6'],
          balance: '0',
        },
        ['ethereum-sepolia:0x7']: {
          ...state.tokens.tokenBalances['ethereum-sepolia:0x7'],
          balance: '0',
        },
        ['celo-alfajores:0xeur']: {
          ...state.tokens.tokenBalances['celo-alfajores:0xeur'],
          lastKnownPriceUsd: '0.5',
        },
        [mockEthTokenId]: {
          ...state.tokens.tokenBalances[mockEthTokenId],
          balance: '1',
          lastKnownPriceUsd: '500',
        },
      },
    },
  }

  it('returns the correct last known total balance when one network given', () => {
    const lastKnownTokenBalances = lastKnownTokenBalancesSelector(mockState, [
      NetworkId['celo-alfajores'],
    ])
    expect(lastKnownTokenBalances).toEqual(new BigNumber(193.5))
  })

  it('returns the correct last known total balance when multiple networks given', () => {
    const lastKnownTokenBalances = lastKnownTokenBalancesSelector(mockState, [
      NetworkId['celo-alfajores'],
      NetworkId['ethereum-sepolia'],
    ])
    expect(lastKnownTokenBalances).toEqual(new BigNumber(623.5))
  })
})

describe('swappable tokens selectors', () => {
  const expectedSwappableToTokens = [
    // highest usd balance
    {
      balance: '50',
      name: 'cEUR',
      priceUsd: '0.5',
    },
    // tokens with balance but no usd price, sorted by balance
    {
      balance: '50',
      name: '0x4 token',
      priceUsd: null,
    },
    {
      balance: '50',
      name: '0x5 token',
      priceUsd: null,
    },
    {
      balance: '50',
      name: '0x7 token',
      priceUsd: null,
    },
    // tokens with usd price but no balance, sorted by name
    {
      balance: '0',
      name: 'cUSD',
      priceUsd: '1',
    },
    {
      balance: '0',
      name: 'Ether',
      priceUsd: '500',
    },
    // tokens with no usd price, no balance, sorted by name
    {
      balance: '0',
      name: '0x6 token',
      priceUsd: null,
    },
  ]

  it('returns the swappable to tokens in the correct order', () => {
    const tokens = swappableToTokensByNetworkIdSelector(state, [
      NetworkId['celo-alfajores'],
      NetworkId['ethereum-sepolia'],
    ])
    // we only need to check some of the details
    const tokenDetails = tokens.map(({ priceUsd, balance, name }) => ({
      priceUsd: priceUsd ? priceUsd.toString() : null,
      balance: balance ? balance.toString() : null,
      name,
    }))

    expect(tokenDetails).toEqual(expectedSwappableToTokens)
  })

  it('returns the swappable from tokens in the correct order', () => {
    const tokens = swappableFromTokensByNetworkIdSelector(state, [
      NetworkId['celo-alfajores'],
      NetworkId['ethereum-sepolia'],
    ])
    // we only need to check some of the details
    const tokenDetails = tokens.map(({ priceUsd, balance, name }) => ({
      priceUsd: priceUsd ? priceUsd.toString() : null,
      balance: balance ? balance.toString() : null,
      name,
    }))

    expect(tokenDetails).toEqual([
      // not swappable, but the user has a balance
      {
        balance: '10',
        name: '0x1 token',
        priceUsd: '10',
      },
      ...expectedSwappableToTokens,
    ])
  })

  describe('importedTokensSelector', () => {
    const mockState: any = {
      tokens: {
        tokenBalances: {
          ...state.tokens.tokenBalances,
          ['celo-alfajores:importedToken']: {
            name: 'importedToken',
            tokenId: 'celo-alfajores:importedToken',
            networkId: NetworkId['celo-alfajores'],
            balance: '10000',
            priceFetchedAt: mockDate,
            minimumAppVersionToSwap: '1.10.0',
            isManuallyImported: true,
          },
          ['ethereum-sepolia:importedToken']: {
            name: 'importedToken',
            tokenId: 'ethereum-sepolia:importedToken',
            networkId: NetworkId['ethereum-sepolia'],
            balance: '20',
            priceFetchedAt: mockDate,
            minimumAppVersionToSwap: '1.10.0',
            isManuallyImported: true,
          },
        },
      },
    }

    it('returns all the imported tokens', () => {
      const importedTokens = importedTokensSelector(mockState, [
        NetworkId['celo-alfajores'],
        NetworkId['ethereum-sepolia'],
      ])

      expect(importedTokens).toMatchObject([
        {
          ...mockState.tokens.tokenBalances['celo-alfajores:importedToken'],
          balance: new BigNumber(10000),
        },
        {
          ...mockState.tokens.tokenBalances['ethereum-sepolia:importedToken'],
          balance: new BigNumber(20),
        },
      ])
    })

    it('return the imported tokens for the selected networks', () => {
      const importedTokens = importedTokensSelector(mockState, [NetworkId['celo-alfajores']])

      expect(importedTokens).toMatchObject([
        {
          ...mockState.tokens.tokenBalances['celo-alfajores:importedToken'],
          balance: new BigNumber(10000),
        },
      ])
    })
  })
})
