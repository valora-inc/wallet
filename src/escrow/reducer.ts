import { createSelector } from 'reselect'
import { Actions, ActionTypes, EscrowedPayment } from 'src/escrow/actions'
import { RootState } from 'src/redux/reducers'

interface State {
  isReclaiming: boolean
  sentEscrowedPayments: EscrowedPayment[]
}

const initialState = {
  isReclaiming: false,
  sentEscrowedPayments: [],
}

export const escrowReducer = (
  state: State | undefined = initialState,
  action: ActionTypes
): State => {
  switch (action.type) {
    case Actions.STORE_SENT_PAYMENTS:
      return {
        ...state,
        sentEscrowedPayments: action.sentPayments,
      }
    case Actions.RECLAIM_PAYMENT:
      return {
        ...state,
        isReclaiming: true,
      }
    case Actions.RECLAIM_PAYMENT_FAILURE:
      return {
        ...state,
        isReclaiming: false,
      }
    case Actions.RECLAIM_PAYMENT_CANCEL:
      return {
        ...state,
        isReclaiming: false,
      }
    case Actions.RECLAIM_PAYMENT_SUCCESS:
      return {
        ...state,
        isReclaiming: false,
      }
    default:
      return state
  }
}

export const sentEscrowedPaymentsSelector = (state: RootState) => state.escrow.sentEscrowedPayments
export const getReclaimableEscrowPayments = createSelector(
  sentEscrowedPaymentsSelector,
  (sentPayments) => {
    const currUnixTime = Date.now() / 1000
    return sentPayments.filter((payment) => {
      const paymentExpiryTime = +payment.timestamp + +payment.expirySeconds
      return currUnixTime >= paymentExpiryTime
    })
  }
)
