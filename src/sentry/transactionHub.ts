import * as Sentry from '@sentry/react-native'
import { Transaction, TransactionContext } from '@sentry/types'

// @ts-ignore
export class TransactionHub {
  private static instance: TransactionHub
  transactions: Array<Transaction>

  private constructor() {
    this.transactions = []
  }

  public static getInstance(): TransactionHub {
    if (!TransactionHub.instance) {
      TransactionHub.instance = new TransactionHub()
    }
    return TransactionHub.instance
  }

  public startTransaction(transactionContext: TransactionContext) {
    const transaction = Sentry.startTransaction(transactionContext)
    this.transactions.push(transaction)
  }

  public finishTransaction(op: string): Transaction {
    // Find all the transactions with this op.
    const selectedTransactions = this.transactions.filter((transaction) => transaction.op === op)

    // Finish each of the transactions with this op.
    selectedTransactions.forEach((t) => t.finish())

    // Remove these finished transactions from the transaction hub
    this.transactions = this.transactions.filter((transaction) => transaction.op !== op)

    return selectedTransactions as any
  }
}
