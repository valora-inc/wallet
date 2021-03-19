import { Counter, Histogram } from 'prom-client'

export class ApiMetrics {
  private unknownTransactionCounter: Counter<string>
  private rawTokenTransactionsDuration: Histogram<string>
  private queryExchangeRateDuration: Histogram<string>

  constructor() {
    this.unknownTransactionCounter = new Counter({
      name: 'get_unknown_transaction_type',
      help: 'Increments when an unknown transaction type is ingested.',
    })

    this.rawTokenTransactionsDuration = new Histogram({
      name: 'query_raw_token_transactions_ms',
      help:
        'Measure of the execution duration (ms) of the getRawTokenTransactions method which fetches data from blockscout.',
      buckets: [0.1, 5, 15, 50, 100, 500],
    })

    this.queryExchangeRateDuration = new Histogram({
      name: 'query_exchange_rate_ms',
      help:
        'Measure of the execution duration (ms) of the queryExchangeRate method which fetches exchange rates for Valora.',
      buckets: [0.1, 5, 15, 50, 100, 500],
    })
  }

  unknownTransaction() {
    this.unknownTransactionCounter.inc()
  }

  setRawTokenDuration(durationMs: number) {
    this.rawTokenTransactionsDuration.observe(durationMs)
  }

  setQueryExchangeRateDuration(durationMs: number) {
    this.queryExchangeRateDuration.observe(durationMs)
  }
}
export const metrics = new ApiMetrics()
