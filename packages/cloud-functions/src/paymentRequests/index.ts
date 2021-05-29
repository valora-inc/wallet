import * as functions from 'firebase-functions'
import { database } from '../firebase'
import { getTranslatorForAddress, sendNotification } from '../notifications'
import { Currencies, NotificationTypes } from '../notifications/types'

enum PaymentRequestStatus {
  REQUESTED = 'REQUESTED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}

interface PaymentRequest {
  amount: string
  timestamp?: string
  requesterE164Number?: string
  requesterAddress: string
  requesteeAddress: string
  currency: Currencies
  comment?: string
  status: PaymentRequestStatus
  notified: boolean
  type?: NotificationTypes.PAYMENT_REQUESTED
}

async function notifyPaymentRequest(id: string, request: PaymentRequest) {
  if (request.notified) {
    return
  }
  console.info('Received payment request', id, JSON.stringify(request))
  await database().ref(`/pendingRequests/${id}`).update({ notified: true })
  await sendRequestedPaymentNotification(id, request)
}

function paymentObjectToNotification(po: PaymentRequest): { [key: string]: string } {
  return {
    amount: po.amount,
    ...(po.timestamp ? { timestamp: po.timestamp } : {}),
    ...(po.requesterE164Number ? { requesterE164Number: po.requesterE164Number } : {}),
    requesterAddress: po.requesterAddress,
    requesteeAddress: po.requesteeAddress,
    currency: po.currency,
    ...(po.comment ? { comment: po.comment } : {}),
    status: po.status,
    type: String(po.type),
  }
}

export async function sendRequestedPaymentNotification(id: string, data: PaymentRequest) {
  const { requesteeAddress, amount, currency } = data
  const t = await getTranslatorForAddress(requesteeAddress)

  data.type = NotificationTypes.PAYMENT_REQUESTED
  return sendNotification(
    t('paymentRequestedTitle'),
    t('paymentRequestedBody', {
      amount,
      // TODO: Use local currency for this.
      currency: t(currency, { count: parseInt(amount, 10) }),
    }),
    requesteeAddress,
    { uid: id, ...paymentObjectToNotification(data) }
  )
}

export const notifyPaymentRequests = functions.database
  .ref('pendingRequests/{requestId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists()) {
      return
    }
    const requestId = context.params.requestId
    const paymentRequest: PaymentRequest = change.after.val()
    await notifyPaymentRequest(requestId, paymentRequest)
  })
