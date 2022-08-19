import * as Sentry from '@sentry/react-native'
import { Transaction } from '@sentry/types'
import { SentryTransaction, SentryTransactions } from 'src/sentry/SentryTransactions'

let transactions = [] as Array<Transaction>

export const SentryTransactionHub = {
  startTransaction(name: SentryTransaction) {
    const transaction = Sentry.startTransaction({ ...SentryTransactions[name], trimEnd: true })
    transactions.push(transaction)
  },
  finishTransaction(name: SentryTransaction) {
    // get transaction operation - 'op'
    const op = SentryTransactions[name].op

    // Find first the transaction with this op.
    const selectedTransaction = transactions.find(
      (transaction) => transaction.op === SentryTransactions[name].op
    )

    // Finish the selected transaction
    selectedTransaction?.finish()

    // Remove all transactions matching op from the transaction hub
    transactions = transactions.filter((transaction) => transaction.op !== op)
  },
}
