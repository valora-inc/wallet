import AsyncPolling from 'async-polling'
import { handleTransferNotifications } from './blockscout/transfers'
import { POLLING_INTERVAL } from './config'

export const notificationPolling = AsyncPolling(async (end) => {
  try {
    await handleTransferNotifications()
  } catch (e) {
    console.error('Notifications polling failed', e)
  } finally {
    end()
  }
}, POLLING_INTERVAL)
