import AsyncPolling from 'async-polling'
import { handleTransferNotifications } from './blockscout/transfers'
import {
  ACCOUNTS_POLLING_INTERVAL,
  ATTESTATIONS_POLLING_INTERVAL,
  INVITES_POLLING_INTERVAL,
  POLLING_INTERVAL,
  TRANSFERS_POLLING_INTERVAL,
} from './config'
import { handleAccountMappings } from './indexer/accounts'
import { handleAttestations } from './indexer/attestations'
import { handleInvites } from './indexer/invites'
import { handlecUsdTransfers } from './indexer/transfers'

export const notificationPolling = AsyncPolling(async (end) => {
  try {
    await handleTransferNotifications()
  } catch (e) {
    console.error('Notifications polling failed', e)
  } finally {
    end()
  }
}, POLLING_INTERVAL)

export const pollers = [
  { fx: handleInvites, interval: INVITES_POLLING_INTERVAL },
  { fx: handleAccountMappings, interval: ACCOUNTS_POLLING_INTERVAL },
  { fx: handleAttestations, interval: ATTESTATIONS_POLLING_INTERVAL },
  { fx: handlecUsdTransfers, interval: TRANSFERS_POLLING_INTERVAL },
].map((poller) =>
  AsyncPolling(async (end) => {
    try {
      await poller.fx()
    } catch (e) {
      console.error('Polling failed', e)
    } finally {
      end()
    }
  }, poller.interval)
)
