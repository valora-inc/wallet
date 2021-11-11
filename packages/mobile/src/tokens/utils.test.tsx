import BigNumber from 'bignumber.js'
import { getHigherBalanceCurrency } from 'src/tokens/utils'
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
