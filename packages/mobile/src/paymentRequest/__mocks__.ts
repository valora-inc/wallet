import { PaymentRequest, PaymentRequestStatus } from 'src/paymentRequest/types'
import { ShortCurrency } from 'src/utils/currencies'

export function createMockPaymentRequest(partial: object): PaymentRequest {
  return {
    uid: '7363bvby2ba8270273',
    amount: '20',
    comment: 'Just the best',
    requesteeAddress: '0x15280126303735b625',
    currency: ShortCurrency.Dollar,
    timestamp: new Date(),
    requesterAddress: '101929292929',
    status: PaymentRequestStatus.REQUESTED,
    notified: true,
    ...partial,
  }
}
