import { NotificationTypes } from 'src/notifications/types'

export enum PaymentRequestStatus {
  REQUESTED = 'REQUESTED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}

export interface PaymentRequest {
  uid?: string
  amount: string
  comment?: string
  createdAt: number
  requesterAddress: string
  requesteeAddress: string
  requesterE164Number?: string
  status: PaymentRequestStatus
  notified: boolean
  type?: NotificationTypes.PAYMENT_REQUESTED
}

export interface WriteablePaymentRequest extends Omit<PaymentRequest, 'createdAt'> {
  createdAt: object
}
