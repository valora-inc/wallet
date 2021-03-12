import { apiMetrics } from '../metrics'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'

let metrics = new apiMetrics()

export class Any extends TransactionType {
  matches(transaction: Transaction): boolean {
    return true
  }

  getEvent(transaction: Transaction) {
    metrics.unknownTransaction()
    throw new Error('Unknown transaction type')
  }

  isAggregatable(): boolean {
    return false
  }
}
