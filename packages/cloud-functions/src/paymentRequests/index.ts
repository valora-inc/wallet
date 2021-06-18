import * as functions from 'firebase-functions'
import { database } from '../firebase'
import { getTranslatorForAddress, sendNotification } from '../notifications'
import { Currencies, NotificationTypes } from '../notifications/types'

export enum PaymentRequestStatus {
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
  comment?: string
  status: PaymentRequestStatus
  notified: boolean
  type?: NotificationTypes.PAYMENT_REQUESTED
}

export async function notifyPaymentRequest(id: string, request: PaymentRequest) {
  if (request.notified) {
    return
  }
  console.info('Received payment request', id)
  await database().ref(`/pendingRequests/${id}`).update({ notified: true })
  await sendRequestedPaymentNotification(id, request)
}

function paymentObjectToNotification(po: PaymentRequest): { [key: string]: string } {
  return {
    amount: po.amount,
    ...(po.timestamp ? { timestamp: String(po.timestamp) } : {}),
    ...(po.requesterE164Number ? { requesterE164Number: po.requesterE164Number } : {}),
    requesterAddress: po.requesterAddress,
    requesteeAddress: po.requesteeAddress,
    ...(po.comment ? { comment: po.comment } : {}),
    status: po.status,
    type: String(po.type),
  }
}

export async function sendRequestedPaymentNotification(id: string, data: PaymentRequest) {
  const { requesteeAddress, amount } = data
  const t = await getTranslatorForAddress(requesteeAddress)
  data.type = NotificationTypes.PAYMENT_REQUESTED
  return sendNotification(
    t('paymentRequestedTitle'),
    t('paymentRequestedBody', {
      amount: Number(amount).toFixed(2),
      // TODO: Use local currency for this.
      currency: Currencies.Dollar,
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
