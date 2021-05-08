import { useSelector } from 'react-redux'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { cEurBalanceSelector, cUsdBalanceSelector } from 'src/stableToken/reducer'
import { Currency } from 'src/utils/currencies'

export function useCurrencyBalance(currency: Currency) {
  const balances = {
    [Currency.Celo]: useSelector(celoTokenBalanceSelector),
    [Currency.Dollar]: useSelector(cUsdBalanceSelector),
    [Currency.Euro]: useSelector(cEurBalanceSelector),
  }
  return balances[currency]
}
