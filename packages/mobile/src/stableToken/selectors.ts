import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { getHigherBalanceCurrency } from 'src/tokens/utils'
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
  localCurrencyExchangeRatesSelector,
  (state: RootState) => state.send.lastUsedCurrency,
  (balances, exchangeRates, lastCurrency) => {
    if (
      balances[lastCurrency]?.gt(STABLE_TRANSACTION_MIN_AMOUNT) &&
      exchangeRates[lastCurrency] !== null
    ) {
      return lastCurrency
    }

    return getHigherBalanceCurrency(STABLE_CURRENCIES, balances, exchangeRates) ?? Currency.Dollar
  }
)
