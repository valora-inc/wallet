import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/fiatconnect/actions'

export interface FiatConnectTransferOut {
  quoteId: string
  isSending: boolean
  failed: boolean
}

export interface State {
  transfersOut: {
    [quoteId: string]: FiatConnectTransferOut
  }
}

const initialState = {
  transfersOut: {},
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case Actions.START_FC_TRANSFER_OUT:
      return {
        ...state,
        transfersOut: {
          ...state.transfersOut,
          [action.quoteId]: {
            quoteId: action.quoteId,
            isSending: true,
            failed: false,
          },
        },
      }
    case Actions.FC_TRANSFER_OUT_FAILED:
      return {
        ...state,
        transfersOut: {
          ...state.transfersOut,
          [action.quoteId]: {
            quoteId: action.quoteId,
            isSending: false,
            failed: true,
          },
        },
      }
    case Actions.FC_TRANSFER_OUT_SUCCESS:
      return {
        ...state,
        transfersOut: {
          ...state.transfersOut,
          [action.quoteId]: {
            quoteId: action.quoteId,
            isSending: false,
            failed: false,
          },
        },
      }
    default:
      return state
  }
}
