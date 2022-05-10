import BigNumber from 'bignumber.js'
import {
  getHigherBalanceCurrency,
  sortFirstStableThenCeloThenOthersByUsdBalance,
} from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'

describe(getHigherBalanceCurrency, () => {
  it('should return the currency with the higher balance in the local currency', () => {
    const balances = {
      [Currency.Dollar]: new BigNumber(1),
      [Currency.Euro]: new BigNumber(1),
      [Currency.Celo]: new BigNumber(1),
    }
    const exchangesRates = {
      [Currency.Dollar]: '1',
      [Currency.Euro]: '2',
      [Currency.Celo]: '3',
    }

    expect(
      getHigherBalanceCurrency(
        [Currency.Dollar, Currency.Euro, Currency.Celo],
        balances,
        exchangesRates
      )
    ).toEqual('cGLD')
    expect(
      getHigherBalanceCurrency([Currency.Dollar, Currency.Euro], balances, exchangesRates)
    ).toEqual('cEUR')
    expect(getHigherBalanceCurrency([Currency.Dollar], balances, exchangesRates)).toEqual('cUSD')
  })

  it('should return `undefined` when balances are `null`', () => {
    const balances = {
      [Currency.Dollar]: null,
      [Currency.Euro]: null,
      [Currency.Celo]: null,
    }
    const exchangesRates = {
      [Currency.Dollar]: '1',
      [Currency.Euro]: '2',
      [Currency.Celo]: '3',
    }

    expect(
      getHigherBalanceCurrency([Currency.Dollar, Currency.Euro], balances, exchangesRates)
    ).toEqual(undefined)
  })

  it('should return `undefined` when exchange rates are `null`', () => {
    const balances = {
      [Currency.Dollar]: new BigNumber(1),
      [Currency.Euro]: new BigNumber(1),
      [Currency.Celo]: new BigNumber(1),
    }
    const exchangesRates = {
      [Currency.Dollar]: null,
      [Currency.Euro]: null,
      [Currency.Celo]: null,
    }

    expect(
      getHigherBalanceCurrency([Currency.Dollar, Currency.Euro], balances, exchangesRates)
    ).toEqual(undefined)
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
