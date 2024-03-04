import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { Recipient, areRecipientsEquivalent } from 'src/recipients/recipient'
import { REHYDRATE, RehydrateAction, getRehydratePayload } from 'src/redux/persist-helper'
import { ActionTypes, Actions } from 'src/send/actions'
import { timeDeltaInHours } from 'src/utils/time'

// Sets the limit of recent recipients we want to store
const RECENT_RECIPIENTS_TO_STORE = 8

// We need to know the last 24 hours of payments (for compliance reasons)
export interface PaymentInfo {
  timestamp: number
  amount: number
}

interface State {
  isSending: boolean
  recentRecipients: Recipient[]
  // Keep a list of recent (last 24 hours) payments
  recentPayments: PaymentInfo[]
  inviteRewardsVersion: string
  lastUsedTokenId?: string
  encryptedComment: string | null
  isEncryptingComment: boolean
}

const initialState = {
  isSending: false,
  recentRecipients: [],
  recentPayments: [],
  inviteRewardsVersion: REMOTE_CONFIG_VALUES_DEFAULTS.inviteRewardsVersion,
  encryptedComment: null,
  isEncryptingComment: false,
}

export const sendReducer = (
  state: State = initialState,
  action: ActionTypes | RehydrateAction | UpdateConfigValuesAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'send'),
        isSending: false,
        encryptedComment: null,
        isEncryptingComment: false,
      }
    }
    case Actions.SEND_PAYMENT:
      return {
        ...storeLatestRecentReducer(state, action.recipient),
        isSending: true,
      }
    case Actions.SEND_PAYMENT_SUCCESS:
      const now = Date.now()
      // Keep only the last 24 hours
      const paymentsLast24Hours = state.recentPayments.filter(
        (p: PaymentInfo) => timeDeltaInHours(now, p.timestamp) < 24
      )
      const latestPayment: PaymentInfo = { amount: action.amount.toNumber(), timestamp: now }
      return {
        ...state,
        isSending: false,
        recentPayments: [...paymentsLast24Hours, latestPayment],
        lastUsedTokenId: action.tokenId,
        encryptedComment: null,
      }
    case Actions.SEND_PAYMENT_FAILURE:
      return {
        ...state,
        isSending: false,
        encryptedComment: null,
      }
    case Actions.ENCRYPT_COMMENT:
      return {
        ...state,
        isEncryptingComment: true,
        encryptedComment: null,
      }
    case Actions.ENCRYPT_COMMENT_COMPLETE:
      return {
        ...state,
        isEncryptingComment: false,
        encryptedComment: action.encryptedComment,
      }
    case AppActions.UPDATE_REMOTE_CONFIG_VALUES:
      return {
        ...state,
        inviteRewardsVersion: action.configValues.inviteRewardsVersion,
      }
    default:
      return state
  }
}

const storeLatestRecentReducer = (state: State, newRecipient: Recipient) => {
  const recentRecipients = [
    newRecipient,
    ...state.recentRecipients.filter(
      (existingRecipient) => !areRecipientsEquivalent(newRecipient, existingRecipient)
    ),
  ].slice(0, RECENT_RECIPIENTS_TO_STORE)

  return {
    ...state,
    recentRecipients,
  }
}
