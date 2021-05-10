import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { DOLLAR_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { RootState } from 'src/redux/reducers'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'

export const cUsdBalanceSelector = (state: RootState) => state.stableToken.balance
export const cEurBalanceSelector = (state: RootState) => state.stableToken.cEurBalance

export const balancesSelector = createSelector<
  RootState,
  string | null,
  string | null,
  string | null,
  { [currency in Currency]: BigNumber }
>(
  cUsdBalanceSelector,
  cEurBalanceSelector,
  celoTokenBalanceSelector,
  (cUsdBalance, cEurBalance, celoBalance) => {
    return {
      [Currency.Dollar]: new BigNumber(cUsdBalance ?? ''),
      [Currency.Euro]: new BigNumber(cEurBalance ?? ''),
      [Currency.Celo]: new BigNumber(celoBalance ?? ''),
    }
  }
)

export const defaultCurrencySelector = createSelector(
  balancesSelector,
  (state: RootState) => state.send.lastUsedCurrency,
  (balances, lastCurrency) => {
    if (balances[lastCurrency].lt(DOLLAR_TRANSACTION_MIN_AMOUNT)) {
      // Return currency with higher balance
      let maxCurrency = Currency.Dollar
      let maxBalance = balances[maxCurrency]
      for (const currency of STABLE_CURRENCIES) {
        if (balances[currency].gt(maxBalance)) {
          maxCurrency = currency
          maxBalance = balances[currency]
        }
      }
      return maxCurrency
    } else {
      return lastCurrency
    }
  }
)
