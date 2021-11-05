import BigNumber from 'bignumber.js'
import { convertCurrencyToLocalAmount } from 'src/localCurrency/convert'
import useSelector from 'src/redux/useSelector'
import { Balances } from 'src/stableToken/selectors'
import { tokensListSelector } from 'src/tokens/selectors'
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

export function useIsCoreToken(tokenAddress: string) {
  const tokens = useSelector(tokensListSelector)
  console.log(tokens, tokenAddress)
  const token = tokens.find((token) => token.address === tokenAddress)
  if (!token) return false
  return ['cUSD', 'cEUR', 'CELO'].includes(token.symbol)
}
