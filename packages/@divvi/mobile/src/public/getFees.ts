import type { GetFeeCurrencyAndAmounts } from '../viem/prepareTransactions'
import type { PreparedTransactionsResult } from './prepareTransactions'

export function getFees(prepareTransactionsResult: PreparedTransactionsResult | undefined) {
  const getFeeCurrencyAndAmounts = require('../viem/prepareTransactions')
    .getFeeCurrencyAndAmounts as GetFeeCurrencyAndAmounts
  return getFeeCurrencyAndAmounts(prepareTransactionsResult)
}
