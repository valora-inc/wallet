import BigNumber from 'bignumber.js'
import { CurrencyTokens } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import {
  convertLocalToTokenAmount,
  convertTokenToLocalAmount,
  getHigherBalanceCurrency,
  sortFirstStableThenCeloThenOthersByUsdBalance,
} from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'

describe(getHigherBalanceCurrency, () => {
  const tokens = {
    [Currency.Dollar]: {
      symbol: 'cUSD',
      isCoreToken: true,
      priceUsd: new BigNumber(1),
      balance: new BigNumber(2),
    },
    [Currency.Euro]: {
      symbol: 'cEUR',
      isCoreToken: true,
      priceUsd: new BigNumber(1.5),
      balance: new BigNumber(1),
    },
    [Currency.Celo]: {
      symbol: 'CELO',
      isCoreToken: true,
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
      isCoreToken: true,
      priceUsd: new BigNumber(1),
      balance: new BigNumber(2),
    },
    {
      symbol: 'cEUR',
      isCoreToken: true,
      priceUsd: new BigNumber(1.5),
      balance: new BigNumber(1),
    },
    {
      symbol: 'CELO',
      isCoreToken: true,
      priceUsd: new BigNumber(5),
      balance: new BigNumber(1),
    },
    {
      symbol: 'wBIT',
      isCoreToken: false,
      priceUsd: new BigNumber(5000),
      balance: new BigNumber(1),
    },
    {
      symbol: 'wETH',
      isCoreToken: false,
      priceUsd: new BigNumber(3000),
      balance: new BigNumber(1),
    },
    {
      symbol: 'TT2',
      isCoreToken: false,
      priceUsd: undefined,
      balance: new BigNumber(5),
    },
    {
      symbol: 'TT',
      isCoreToken: false,
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
