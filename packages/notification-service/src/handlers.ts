import {
  getPendingRequests,
  requestedPaymentNotification,
  setPaymentRequestNotified,
} from './firebase'
import { metrics } from './metrics'

export async function handlePaymentRequests() {
  console.debug('Checking payment requests....')
  const allPendingRequests = getPendingRequests()
  if (!allPendingRequests) {
    console.debug('No pending payment requests')
    return
  }
  const keys = Object.keys(allPendingRequests)
  console.debug(`Found ${keys.length} pending payment requests`)

  let numUnnotifiedRequests = 0
  for (const uid of keys) {
    const request = allPendingRequests[uid]
    if (request.notified) {
      continue
    }
    numUnnotifiedRequests += 1
    await setPaymentRequestNotified(uid)
    await requestedPaymentNotification(uid, request)
  }
  metrics.setNumberPendingRequests(numUnnotifiedRequests)
}
