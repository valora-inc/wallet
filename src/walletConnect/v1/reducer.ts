import {
  WalletConnectPayloadRequest,
  WalletConnectSession,
  WalletConnectSessionRequest,
} from 'src/walletConnect/types'
import { Actions, UserActions, WalletConnectActions } from 'src/walletConnect/v1/actions'

export type PendingAction = { action: WalletConnectPayloadRequest; peerId: string }

export interface State {
  pendingActions: PendingAction[]
  sessions: WalletConnectSession[]
  pendingSessions: WalletConnectSessionRequest[]
}

const initialState: State = {
  pendingActions: [],
  sessions: [],
  pendingSessions: [],
}

export const reducer = (
  state: State | undefined = initialState,
  action: WalletConnectActions | UserActions
): State => {
  switch (action.type) {
    case Actions.SESSION_V1:
      return {
        ...state,
        pendingSessions: [...state.pendingSessions, action.session],
      }
    case Actions.SESSION_DELETED_V1:
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.peerId !== action.peerId),
      }
    case Actions.ACCEPT_SESSION_V1:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter((s) => s.params[0].peerId !== action.peerId),
      }
    case Actions.DENY_SESSION_V1:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter((s) => s.params[0].peerId !== action.peerId),
      }
    case Actions.CLOSE_SESSION_V1:
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.peerId !== action.session.peerId),
      }
    case Actions.STORE_SESSION_V1:
      return {
        ...state,
        sessions: [...state.sessions, action.session],
      }
    case Actions.PAYLOAD_V1:
      return {
        ...state,
        pendingActions: [
          ...state.pendingActions,
          { action: action.request, peerId: action.peerId },
        ],
      }
    case Actions.ACCEPT_REQUEST_V1:
    case Actions.DENY_REQUEST_V1:
      return {
        ...state,
        pendingActions: state.pendingActions.filter((a) => a.action !== action.request),
      }

    default:
      return state
  }
}
