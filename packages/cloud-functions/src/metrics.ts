import { Counter, Histogram } from 'prom-client'

export class ApiMetrics {
  private exchangeQueryDuration: Histogram<string>
  private numberSuccessfulNotifications: Counter<string>
  private numberUnsuccessfulNotifications: Counter<string>
  private notificationLatency: Histogram<string>

  constructor() {
    this.exchangeQueryDuration = new Histogram({
      name: 'handle_exchange_query_ms',
      help:
        'Samples the execution duration of the query within handleExchangeQuery, a measure of how long it takes to retrieve external exchange rates.',
      buckets: [10, 50, 100, 250, 500, 1000, 5000, 10000],
    })

    this.numberSuccessfulNotifications = new Counter({
      name: 'num_successful_notifications',
      help: 'Increments the Notifications Service successfully dispatches a notification.',
      labelNames: ['notification_type'],
    })

    this.numberUnsuccessfulNotifications = new Counter({
      name: 'num_unsuccessful_notifications',
      help:
        'Increments the Notifications Service encounters an error while dispatching a notification.',
      labelNames: ['notification_type'],
    })

    this.notificationLatency = new Histogram({
      name: 'notification_latency_secs',
      help:
        'Samples the difference in seconds between when the notification was sent and the timestamp on the event that is being notified for',
      buckets: [0.1, 1, 5, 10, 25, 75, 200, 500],
      labelNames: ['notification_type'],
    })
  }

  setExchangeQueryDuration(durationSeconds: number) {
    this.exchangeQueryDuration.observe(durationSeconds)
  }

  sentNotification(notificationType: string) {
    this.numberSuccessfulNotifications.inc({ notification_type: notificationType })
  }

  failedNotification(notificationType: string) {
    this.numberUnsuccessfulNotifications.inc({ notification_type: notificationType })
  }

  setNotificationLatency(durationSeconds: number, notificationType: string) {
    this.notificationLatency.observe({ notification_type: notificationType }, durationSeconds)
  }
}
export const metrics = new ApiMetrics()
