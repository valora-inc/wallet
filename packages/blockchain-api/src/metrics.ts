import { Counter } from 'prom-client'

export class ApiMetrics {
  private unknownTransactionCounter: Counter<string>

  constructor() {
    this.unknownTransactionCounter = new Counter({
      name: 'get_unknown_transaction_type',
      help: 'Increments when an unknown transaction type is ingested.',
    })
  }

  unknownTransaction() {
    this.unknownTransactionCounter.inc()
  }
}
export const metrics = new ApiMetrics()
