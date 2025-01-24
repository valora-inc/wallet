import BigNumber from 'bignumber.js'
import { CurrencyTokens } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import {
  convertLocalToTokenAmount,
  convertTokenToLocalAmount,
  getHigherBalanceCurrency,
  getTokenId,
  isHistoricalPriceUpdated,
  sortFirstStableThenCeloThenOthersByUsdBalance,
} from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { ONE_DAY_IN_MILLIS, ONE_HOUR_IN_MILLIS } from 'src/utils/time'
import networkConfig from 'src/web3/networkConfig'
import { mockPoofTokenId, mockTokenBalances } from 'test/values'

describe(getHigherBalanceCurrency, () => {
  const tokens = {
    [Currency.Dollar]: {
      symbol: 'cUSD',
      isFeeCurrency: true,
      priceUsd: new BigNumber(1),
      balance: new BigNumber(2),
    },
    [Currency.Euro]: {
      symbol: 'cEUR',
      isFeeCurrency: true,
      priceUsd: new BigNumber(1.5),
      balance: new BigNumber(1),
    },
    [Currency.Celo]: {
      symbol: 'CELO',
      isFeeCurrency: true,
      priceUsd: new BigNumber(5),
      balance: new BigNumber(1),
    },
  } as CurrencyTokens
  it('should return the currency with the higher balance in the local currency', () => {
    expect(
      getHigherBalanceCurrency([Currency.Dollar, Currency.Euro, Currency.Celo], tokens)
    ).toEqual('cGLD')
    expect(getHigherBalanceCurrency([Currency.Dollar, Currency.Euro], tokens)).toEqual('cUSD')
    expect(getHigherBalanceCurrency([Currency.Dollar], tokens)).toEqual('cUSD')
  })

  it('should return `undefined` when balances are `null`', () => {
    const undefinedTokens = {
      [Currency.Dollar]: undefined,
      [Currency.Euro]: undefined,
      [Currency.Celo]: undefined,
    }

    expect(getHigherBalanceCurrency([Currency.Dollar, Currency.Euro], undefinedTokens)).toEqual(
      undefined
    )
  })
})

describe(sortFirstStableThenCeloThenOthersByUsdBalance, () => {
  const expectedOrder = [
    {
      symbol: 'cUSD',
      isFeeCurrency: true,
      priceUsd: new BigNumber(1),
      balance: new BigNumber(2),
    },
    {
      symbol: 'cEUR',
      isFeeCurrency: true,
      priceUsd: new BigNumber(1.5),
      balance: new BigNumber(1),
    },
    {
      symbol: 'CELO',
      isFeeCurrency: true,
      priceUsd: new BigNumber(5),
      balance: new BigNumber(1),
    },
    {
      symbol: 'wBIT',
      isFeeCurrency: false,
      priceUsd: new BigNumber(5000),
      balance: new BigNumber(1),
    },
    {
      symbol: 'wETH',
      isFeeCurrency: false,
      priceUsd: new BigNumber(3000),
      balance: new BigNumber(1),
    },
    {
      symbol: 'TT2',
      isFeeCurrency: false,
      priceUsd: undefined,
      balance: new BigNumber(5),
    },
    {
      symbol: 'TT',
      isFeeCurrency: false,
      priceUsd: undefined,
      balance: new BigNumber(2),
    },
  ]

  it(`shouldn't change expected order while sorting`, () => {
    const copy = Object.assign([], expectedOrder)
    copy.sort(sortFirstStableThenCeloThenOthersByUsdBalance)
    expect(copy).toMatchObject(expectedOrder)
    shuffle(copy)
    copy.sort(sortFirstStableThenCeloThenOthersByUsdBalance)
    expect(copy).toMatchObject(expectedOrder)
  })

  // Gives some randomness to the array
  function shuffle(copy: any[]) {
    copy.sort(() => 0.5 - Math.random())
  }
})

describe(convertLocalToTokenAmount, () => {
  const tokenInfo = {
    priceUsd: BigNumber(2),
  } as TokenBalance
  const usdToLocalRate = '20'
  it('returns null if there is no token usd price', () => {
    const tokenAmount = convertLocalToTokenAmount({
      localAmount: BigNumber(10),
      usdToLocalRate,
      tokenInfo: undefined,
    })
    expect(tokenAmount).toEqual(null)
  })

  it('returns null if there is no usd exchange rate', () => {
    const tokenAmount = convertLocalToTokenAmount({
      localAmount: BigNumber(10),
      usdToLocalRate: null,
      tokenInfo,
    })
    expect(tokenAmount).toEqual(null)
  })

  it('returns null if localAmount is null', () => {
    const tokenAmount = convertLocalToTokenAmount({
      localAmount: null,
      usdToLocalRate,
      tokenInfo,
    })
    expect(tokenAmount).toEqual(null)
  })

  it('converts a local amount to a token amount', () => {
    const tokenAmount = convertLocalToTokenAmount({
      localAmount: BigNumber(10),
      usdToLocalRate,
      tokenInfo,
    })
    expect(tokenAmount).toEqual(new BigNumber(0.25))
  })
})

describe(convertTokenToLocalAmount, () => {
  const tokenInfo = {
    priceUsd: BigNumber(2),
  } as TokenBalance
  const usdToLocalRate = '20'
  it('returns null if there is no token usd price', () => {
    const localAmount = convertTokenToLocalAmount({
      tokenAmount: BigNumber(10),
      usdToLocalRate,
      tokenInfo: undefined,
    })
    expect(localAmount).toEqual(null)
  })

  it('returns null if there is no usd exchange rate', () => {
    const localAmount = convertTokenToLocalAmount({
      tokenAmount: BigNumber(10),
      usdToLocalRate: null,
      tokenInfo,
    })
    expect(localAmount).toEqual(null)
  })

  it('returns null if localAmount is null', () => {
    const localAmount = convertTokenToLocalAmount({
      tokenAmount: null,
      usdToLocalRate,
      tokenInfo,
    })
    expect(localAmount).toEqual(null)
  })

  it('converts a token amount to a local amount', () => {
    const localAmount = convertTokenToLocalAmount({
      tokenAmount: BigNumber(10),
      usdToLocalRate,
      tokenInfo,
    })
    expect(localAmount).toEqual(new BigNumber(400))
  })
})

describe(getTokenId, () => {
  it('returns Celo native token correctly', () => {
    const tokenId = getTokenId(NetworkId['celo-alfajores'], networkConfig.celoTokenAddress)
    expect(tokenId).toEqual('celo-alfajores:native')
  })
  it('returns normal Celo token correctly', () => {
    const tokenId = getTokenId(NetworkId['celo-alfajores'], '0xsomeaddress')
    expect(tokenId).toEqual('celo-alfajores:0xsomeaddress')
  })
  it('returns Ethereum native token correctly', () => {
    const tokenId = getTokenId(NetworkId['ethereum-sepolia'])
    expect(tokenId).toEqual('ethereum-sepolia:native')
  })
  it('returns normal Ethereum token correctly', () => {
    const tokenId = getTokenId(NetworkId['ethereum-sepolia'], '0xsomeaddress')
    expect(tokenId).toEqual('ethereum-sepolia:0xsomeaddress')
  })
})

describe(isHistoricalPriceUpdated, () => {
  const mockTokenBalance: TokenBalance = {
    ...mockTokenBalances[mockPoofTokenId],
    balance: new BigNumber(0),
    lastKnownPriceUsd: new BigNumber(0),
    priceUsd: new BigNumber(0),
  }

  it('returns false if no historical price is set', () => {
    expect(isHistoricalPriceUpdated(mockTokenBalance)).toEqual(false)
  })

  it('returns false if historical price is more than 25h old', () => {
    expect(
      isHistoricalPriceUpdated({
        ...mockTokenBalance,
        historicalPricesUsd: {
          lastDay: {
            at: Date.now() - ONE_DAY_IN_MILLIS - 2 * ONE_HOUR_IN_MILLIS,
            price: new BigNumber(0),
          },
        },
      })
    ).toEqual(false)
  })

  it('returns true if historical price is one day old', () => {
    expect(
      isHistoricalPriceUpdated({
        ...mockTokenBalance,
        historicalPricesUsd: {
          lastDay: {
            at: Date.now() - ONE_DAY_IN_MILLIS,
            price: new BigNumber(0),
          },
        },
      })
    ).toEqual(true)
  })

  it('returns true if historical price is one day + 30 min old', () => {
    expect(
      isHistoricalPriceUpdated({
        ...mockTokenBalance,
        historicalPricesUsd: {
          lastDay: {
            at: Date.now() - ONE_DAY_IN_MILLIS - ONE_HOUR_IN_MILLIS / 2,
            price: new BigNumber(0),
          },
        },
      })
    ).toEqual(true)
  })

  it('returns true if historical price is one day - 30 min old', () => {
    expect(
      isHistoricalPriceUpdated({
        ...mockTokenBalance,
        historicalPricesUsd: {
          lastDay: {
            at: Date.now() - ONE_DAY_IN_MILLIS + ONE_HOUR_IN_MILLIS / 2,
            price: new BigNumber(0),
          },
        },
      })
    ).toEqual(true)
  })
})
