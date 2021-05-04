import { NotificationTypes } from 'src/notifications/types'
import { ShortCurrency } from 'src/utils/currencies'

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
  timestamp: Date
  requesterAddress: string
  requesteeAddress: string
  requesterE164Number?: string
  currency: ShortCurrency
  status: PaymentRequestStatus
  notified: boolean
  type?: NotificationTypes.PAYMENT_REQUESTED
}
