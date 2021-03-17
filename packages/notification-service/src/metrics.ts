import { Counter, Gauge } from 'prom-client'

export class ApiMetrics {
  private numberNotificationsSent: Counter<string>
  private numberBlocksUnprocessed: Gauge<string>

  constructor() {
    this.numberNotificationsSent = new Counter({
      name: 'num_notifications_sent',
      help: 'Increments the Notifications Service dispatches a notification.',
    })

    this.numberBlocksUnprocessed = new Gauge({
      name: 'num_blocks_unprocessed',
      help: 'The current number of unprocessed blocks in the (thing).',
    })
  }

  sentNotification() {
    this.numberNotificationsSent.inc()
  }

  setUnprocessedBlocks(count: number) {
    this.numberBlocksUnprocessed.set({}, count)
  }
}
export const metrics = new ApiMetrics()
