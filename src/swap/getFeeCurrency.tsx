import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'

export function getFeeCurrency(preparedTransactions: TransactionRequestCIP42[]) {
  // The prepared transactions always use the same fee currency
  return preparedTransactions[0].feeCurrency
}
