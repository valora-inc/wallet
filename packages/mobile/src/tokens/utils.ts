import BigNumber from 'bignumber.js'
import { convertCurrencyToLocalAmount } from 'src/localCurrency/convert'
import { Balances } from 'src/stableToken/selectors'
import { Currency } from 'src/utils/currencies'
import { TokenBalance } from './reducer'

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

export function sortByUsdBalance(token1: TokenBalance, token2: TokenBalance) {
  const token1UsdBalance = token1.balance.multipliedBy(token1.usdPrice ?? 0)
  const token2UsdBalance = token2.balance.multipliedBy(token2.usdPrice ?? 0)
  return token2UsdBalance.comparedTo(token1UsdBalance)
}

export function isStablecoin(token: TokenBalance | undefined) {
  return token?.isCoreToken && token.symbol !== 'CELO'
}
