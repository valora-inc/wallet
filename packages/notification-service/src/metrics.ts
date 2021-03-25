import { Counter, Gauge, Histogram } from 'prom-client'

export class ApiMetrics {
  private numberSuccessfulNotifications: Counter<string>
  private numberUnsuccessfulNotifications: Counter<string>
  private blockDelay: Gauge<string>
  private pendingRequestsSize: Gauge<string>
  private numberUnnotifiedRequests: Gauge<string>
  private latestTokenTransfersDuration: Histogram<string>
  private notificationLatency: Histogram<string>
  private exchangeQueryDuration: Histogram<string>

  constructor() {
    this.numberSuccessfulNotifications = new Counter({
      name: 'num_successful_notifications',
      help: 'Increments the Notifications Service successfully dispatches a notification.',
    })

    this.numberUnsuccessfulNotifications = new Counter({
      name: 'num_unsuccessful_notifications',
      help:
        'Increments the Notifications Service encounters an error while dispatching a notification.',
    })

    this.blockDelay = new Gauge({
      name: 'block_delay',
      help:
        'The number of blocks that exist to be processed, sampled each time the Notifications Service polls Blockscout.',
    })

    this.pendingRequestsSize = new Gauge({
      name: 'pending_requests_size',
      help:
        'The current size of pendingRequestsRef, the reference to the pending requests array in Firebase.',
    })

    this.numberUnnotifiedRequests = new Gauge({
      name: 'number_unnotified_requests',
      help: 'The current number of pending requests where request.notified == false.',
    })

    this.notificationLatency = new Histogram({
      name: 'notification_latency_secs',
      help:
        'Samples the difference in seconds between when the notification was sent and the timestamp on the event that is being notified for',
      buckets: [0.1, 1, 5, 10, 25, 75, 200, 500],
    })

    this.latestTokenTransfersDuration = new Histogram({
      name: 'latest_token_transfers_duration',
      help: 'Samples the execution duration of the getLatestTokenTransfers query to blockscout.',
      buckets: [0.1, 1, 5, 10, 25, 75, 200, 500],
    })

    this.exchangeQueryDuration = new Histogram({
      name: 'handle_exchange_query_duration',
      help:
        'Samples the execution duration of the query within handleExchangeQuery, a measure of how long it takes to retrieve external exchange rates.',
      buckets: [0.1, 1, 5, 10, 25, 75, 200, 500],
    })
  }

  sentNotification(notificationType: string) {
    this.numberSuccessfulNotifications.inc({ notification_type: notificationType })
  }

  failedNotification(notificationType: string) {
    this.numberUnsuccessfulNotifications.inc({ notification_type: notificationType })
  }

  setPendingRequestsSize(count: number) {
    this.pendingRequestsSize.set(count)
  }

  setNumberUnnotifiedRequests(count: number) {
    this.numberUnnotifiedRequests.set(count)
  }

  setBlockDelay(count: number) {
    this.blockDelay.set({}, count)
  }

  setNotificationLatency(durationSeconds: number, notificationType: string) {
    this.notificationLatency.observe({ notification_type: notificationType }, durationSeconds)
  }

  setLatestTokenTransfersDuration(durationSeconds: number) {
    this.latestTokenTransfersDuration.observe(durationSeconds)
  }

  setExchangeQueryDuration(durationSeconds: number) {
    this.exchangeQueryDuration.observe(durationSeconds)
  }
}
export const metrics = new ApiMetrics()
