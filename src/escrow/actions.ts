import BigNumber from 'bignumber.js'

export interface EscrowedPayment {
  senderAddress: string
  recipientPhone: string
  recipientIdentifier: string
  paymentID: string
  tokenAddress: string
  amount: string
  message?: string
  timestamp: BigNumber
  expirySeconds: BigNumber
}

export enum Actions {
  RECLAIM_PAYMENT = 'ESCROW/RECLAIM_PAYMENT',
  FETCH_SENT_PAYMENTS = 'ESCROW/FETCH_SENT_PAYMENTS',
  STORE_SENT_PAYMENTS = 'ESCROW/STORE_SENT_PAYMENTS',
  RECLAIM_PAYMENT_SUCCESS = 'ESCROW/RECLAIM_PAYMENT_SUCCESS',
  RECLAIM_PAYMENT_FAILURE = 'ESCROW/RECLAIM_PAYMENT_FAILURE',
  RECLAIM_PAYMENT_CANCEL = 'RECLAIM_PAYMENT_CANCEL',
}

export interface EscrowReclaimPaymentAction {
  type: Actions.RECLAIM_PAYMENT
  paymentID: string
}

export interface EscrowFetchSentPaymentsAction {
  type: Actions.FETCH_SENT_PAYMENTS
}

export interface EscrowStoreSentPaymentsAction {
  type: Actions.STORE_SENT_PAYMENTS
  sentPayments: EscrowedPayment[]
}

export interface EscrowReclaimPaymentSuccessAction {
  type: Actions.RECLAIM_PAYMENT_SUCCESS
}

export interface EscrowReclaimFailureAction {
  type: Actions.RECLAIM_PAYMENT_FAILURE
}

export interface EscrowReclaimCancelAction {
  type: Actions.RECLAIM_PAYMENT_CANCEL
}

export type ActionTypes =
  | EscrowReclaimPaymentAction
  | EscrowFetchSentPaymentsAction
  | EscrowStoreSentPaymentsAction
  | EscrowReclaimPaymentSuccessAction
  | EscrowReclaimFailureAction
  | EscrowReclaimCancelAction

export const reclaimEscrowPayment = (paymentID: string): EscrowReclaimPaymentAction => ({
  type: Actions.RECLAIM_PAYMENT,
  paymentID,
})

export const fetchSentEscrowPayments = (): EscrowFetchSentPaymentsAction => ({
  type: Actions.FETCH_SENT_PAYMENTS,
})

export const storeSentEscrowPayments = (
  sentPayments: EscrowedPayment[]
): EscrowStoreSentPaymentsAction => ({
  type: Actions.STORE_SENT_PAYMENTS,
  sentPayments,
})

export const reclaimEscrowPaymentSuccess = (): EscrowReclaimPaymentSuccessAction => ({
  type: Actions.RECLAIM_PAYMENT_SUCCESS,
})

export const reclaimEscrowPaymentFailure = (): EscrowReclaimFailureAction => ({
  type: Actions.RECLAIM_PAYMENT_FAILURE,
})

export const reclaimEscrowPaymentCancel = (): EscrowReclaimCancelAction => ({
  type: Actions.RECLAIM_PAYMENT_CANCEL,
})
