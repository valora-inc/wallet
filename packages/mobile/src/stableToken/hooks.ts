import { useSelector } from 'react-redux'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { balancesSelector } from 'src/stableToken/reducer'
import { Currency } from 'src/utils/currencies'

export function useBalance(currency: Currency) {
  const stableBalances = useSelector(balancesSelector)
  const balances = {
    ...stableBalances,
    [Currency.Celo]: useSelector(celoTokenBalanceSelector),
  }
  return balances[currency]
}
