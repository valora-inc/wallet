import { Counter } from 'prom-client'

export class apiMetrics {
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
let metrics = new apiMetrics()
export { metrics }

// export enum Context { }
