import BigNumber from 'bignumber.js'
import { convertCurrencyToLocalAmount } from 'src/localCurrency/convert'
import { Balances } from 'src/stableToken/selectors'
import { Currency } from 'src/utils/currencies'

export function getHigherBalanceCurrency(
  currencies: Currency[],
  balances: Balances,
  exchangeRates: { [token in Currency]: string | null }
): Currency | undefined {
  let maxCurrency: Currency | undefined
  let maxBalance: BigNumber | null = null
  for (const currency of currencies) {
    const balance = convertCurrencyToLocalAmount(balances[currency], exchangeRates[currency])
    if (balance?.gt(maxBalance ?? 0)) {
      maxCurrency = currency
      maxBalance = balance
    }
  }
  return maxCurrency
}
