import * as Sentry from '@sentry/react-native'
import { Transaction } from '@sentry/types'
import { SentrySpan, SentrySpans } from 'src/sentry/SentrySpans'

let transactions = [] as Array<Transaction>

export const SentryTransactionHub = {
  startTransaction(name: SentrySpan) {
    const transaction = Sentry.startTransaction({ ...SentrySpans[name], trimEnd: true })
    transactions.push(transaction)
  },
  finishTransaction(name: SentrySpan) {
    // get span operation - 'op'
    const op = SentrySpans[name].op

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
