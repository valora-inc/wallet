import BigNumber from 'bignumber.js'
import { CurrencyTokens } from 'src/tokens/selectors'
import {
  getHigherBalanceCurrency,
  sortFirstStableThenCeloThenOthersByUsdBalance,
} from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'

describe(getHigherBalanceCurrency, () => {
  const tokens = {
    [Currency.Dollar]: {
      symbol: 'cUSD',
      isCoreToken: true,
      usdPrice: new BigNumber(1),
      balance: new BigNumber(2),
    },
    [Currency.Euro]: {
      symbol: 'cEUR',
      isCoreToken: true,
      usdPrice: new BigNumber(1.5),
      balance: new BigNumber(1),
    },
    [Currency.Celo]: {
      symbol: 'CELO',
      isCoreToken: true,
      usdPrice: new BigNumber(5),
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
      usdPrice: new BigNumber(1),
      balance: new BigNumber(2),
    },
    {
      symbol: 'cEUR',
      isCoreToken: true,
      usdPrice: new BigNumber(1.5),
      balance: new BigNumber(1),
    },
    {
      symbol: 'CELO',
      isCoreToken: true,
      usdPrice: new BigNumber(5),
      balance: new BigNumber(1),
    },
    {
      symbol: 'wBIT',
      isCoreToken: false,
      usdPrice: new BigNumber(5000),
      balance: new BigNumber(1),
    },
    {
      symbol: 'wETH',
      isCoreToken: false,
      usdPrice: new BigNumber(3000),
      balance: new BigNumber(1),
    },
    {
      symbol: 'TT2',
      isCoreToken: false,
      usdPrice: undefined,
      balance: new BigNumber(5),
    },
    {
      symbol: 'TT',
      isCoreToken: false,
      usdPrice: undefined,
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
