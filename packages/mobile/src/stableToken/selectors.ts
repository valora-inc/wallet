import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { DOLLAR_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { RootState } from 'src/redux/reducers'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'

export type Balances = {
  [currency in Currency]: BigNumber | null
}

export const stableBalancesSelector = (state: RootState) => state.stableToken.balances
export const cUsdBalanceSelector = (state: RootState) =>
  state.stableToken.balances[Currency.Dollar] ?? null
export const cEurBalanceSelector = (state: RootState) =>
  state.stableToken.balances[Currency.Euro] ?? null

export const balancesSelector = createSelector<
  RootState,
  string | null,
  string | null,
  string | null,
  Balances
>(
  cUsdBalanceSelector,
  cEurBalanceSelector,
  celoTokenBalanceSelector,
  (cUsdBalance, cEurBalance, celoBalance) => {
    return {
      [Currency.Dollar]: cUsdBalance ? new BigNumber(cUsdBalance) : null,
      [Currency.Euro]: cEurBalance ? new BigNumber(cEurBalance) : null,
      [Currency.Celo]: celoBalance ? new BigNumber(celoBalance) : null,
    }
  }
)

export const defaultCurrencySelector = createSelector(
  balancesSelector,
  (state: RootState) => state.send.lastUsedCurrency,
  (balances, lastCurrency) => {
    if (balances[lastCurrency]?.gt(DOLLAR_TRANSACTION_MIN_AMOUNT)) {
      return lastCurrency
    }
    // Return currency with higher balance
    let maxCurrency = Currency.Dollar
    let maxBalance = balances[maxCurrency]
    for (const currency of STABLE_CURRENCIES) {
      if (!maxBalance || balances[currency]?.gt(maxBalance)) {
        maxCurrency = currency
        maxBalance = balances[currency]
      }
    }
    return maxCurrency
  }
)
