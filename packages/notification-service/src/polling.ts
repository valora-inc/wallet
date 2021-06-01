import AsyncPolling from 'async-polling'
import { handleTransferNotifications } from './blockscout/transfers'
import { INVITES_POLLING_INTERVAL, POLLING_INTERVAL } from './config'
import { handlePaymentRequests } from './handlers'
import { handleInvites } from './invites/invites'

export const notificationPolling = AsyncPolling(async (end) => {
  try {
    await handleTransferNotifications()
    await handlePaymentRequests()
  } catch (e) {
    console.error('Notifications polling failed', e)
  } finally {
    end()
  }
}, POLLING_INTERVAL)

export const invitesPolling = AsyncPolling(async (end) => {
  try {
    await handleInvites()
  } catch (e) {
    console.error('Invites polling failed', e)
  } finally {
    end()
  }
}, INVITES_POLLING_INTERVAL)
