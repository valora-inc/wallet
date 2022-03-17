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

/**
 * It sorts in 3 categories:
 * Stable tokens: (cUSD, cEUR, cREAL) (sorted by usd balance)
 * CELO
 * Other tokens: sorted by usd balance
 *
 * If someone comes with a better name for this, I would appreciate it.
 */
export function sortFirstStableThenCeloThenOthersByUsdBalance(
  token1: TokenBalance,
  token2: TokenBalance
): number {
  // Show core tokens first
  if (token1.isCoreToken && !token2.isCoreToken) {
    return -1
  }
  if (!token1.isCoreToken && token2.isCoreToken) {
    return 1
  }

  // Show stable tokens first
  if (token1.isCoreToken && token2.isCoreToken) {
    if (token1.symbol === 'CELO' && token2.symbol !== 'CELO') {
      return 1
    }
    if (token1.symbol !== 'CELO' && token2.symbol === 'CELO') {
      return -1
    }
  }

  // Show non-native tokens without usd price in the bottom of the list.
  // And show stable tokens without usd price at the bottom of their category.
  if (!token1.usdPrice && !token2.usdPrice) {
    return token2.balance.comparedTo(token1.balance)
  }

  if (!token1.usdPrice) {
    return 1
  }
  if (!token2.usdPrice) {
    return -1
  }

  // In each category sort by usd Balance
  return usdBalance(token2).comparedTo(usdBalance(token1))
}

function usdBalance(token: TokenBalance): BigNumber {
  // We check that usdPrice is not null before calling this.
  return token.usdPrice!.times(token.balance)
}
