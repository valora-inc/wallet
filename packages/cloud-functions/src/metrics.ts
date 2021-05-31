import { Histogram } from 'prom-client'

export class ApiMetrics {
  private exchangeQueryDuration: Histogram<string>

  constructor() {
    this.exchangeQueryDuration = new Histogram({
      name: 'handle_exchange_query_ms',
      help:
        'Samples the execution duration of the query within handleExchangeQuery, a measure of how long it takes to retrieve external exchange rates.',
      buckets: [10, 50, 100, 250, 500, 1000, 5000, 10000],
    })
  }

  setExchangeQueryDuration(durationSeconds: number) {
    this.exchangeQueryDuration.observe(durationSeconds)
  }
}
export const metrics = new ApiMetrics()
