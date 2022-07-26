import * as Sentry from '@sentry/react-native'
import { Transaction } from '@sentry/types'
import { SentrySpan, SentrySpans } from 'src/sentry/SentrySpans'

export const SentryTransactionHub = {
  transactions: [] as Array<Transaction>,
  startTransaction(name: SentrySpan) {
    const transaction = Sentry.startTransaction({ ...SentrySpans[name], trimEnd: true })
    this.transactions.push(transaction)
  },
  finishTransaction(name: SentrySpan) {
    // get span operation - 'op'
    const op = SentrySpans[name].op

    // Find all the transactions with this op.
    const selectedTransactions = this.transactions.filter(
      (transaction) => transaction.op === SentrySpans[name].op
    )

    // Finish each of the transactions with this op.
    selectedTransactions.forEach((t) => t.finish())

    // Remove these finished transactions from the transaction hub
    this.transactions = this.transactions.filter((transaction) => transaction.op !== op)
  },
}
