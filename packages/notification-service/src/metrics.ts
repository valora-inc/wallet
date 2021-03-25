import { Counter, Gauge } from 'prom-client'

export class ApiMetrics {
  private numberSuccessfulNotifications: Counter<string>
  private numberUnsuccessfulNotifications: Counter<string>
  private numberBlocksUnprocessed: Gauge<string>

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

    this.numberBlocksUnprocessed = new Gauge({
      name: 'num_blocks_unprocessed',
      help: 'The current number of unprocessed blocks in the (thing).',
    })
  }

  sentNotification(notificationType: string) {
    this.numberSuccessfulNotifications.inc({ notification_type: notificationType })
  }

  failedNotification(notificationType: string) {
    this.numberUnsuccessfulNotifications.inc({ notification_type: notificationType })
  }

  setUnprocessedBlocks(count: number) {
    this.numberBlocksUnprocessed.set({}, count)
  }
}
export const metrics = new ApiMetrics()
