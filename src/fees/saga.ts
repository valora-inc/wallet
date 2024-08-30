import { CELO_TRANSACTION_MIN_AMOUNT, STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { tokensByUsdBalanceSelector } from 'src/tokens/selectors'
import Logger from 'src/utils/Logger'
import { select } from 'typed-redux-saga'

const TAG = 'fees/saga'

export function* fetchFeeCurrencySaga() {
  const tokens = yield* select(tokensByUsdBalanceSelector)

  for (const token of tokens) {
    if (!token.isFeeCurrency) {
      continue
    }
    if (token.symbol === 'CELO' && token.balance.gte(CELO_TRANSACTION_MIN_AMOUNT)) {
      // Paying for fee with CELO requires passing undefined.
      return undefined
    } else if (token.balance.gte(STABLE_TRANSACTION_MIN_AMOUNT)) {
      return token.address
    }
  }
  Logger.warn(TAG, '@fetchFeeCurrency no currency has enough balance to pay for fee.')
  // This will cause a failure to calculate fee error dialog in the top.
  return undefined
}
