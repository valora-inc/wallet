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
    // get span operation - 'op'
    const op = SentryTransactions[name].op

    // Find all the transactions with this op.
    const selectedTransactions = transactions.filter(
      (transaction) => transaction.op === SentrySpans[name].op
    )

    // Finish each of the transactions with this op.
    selectedTransactions.forEach((t) => t.finish())

    // Remove these finished transactions from the transaction hub
    transactions = transactions.filter((transaction) => transaction.op !== op)
  },
}
