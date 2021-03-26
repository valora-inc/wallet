import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { Actions, UserActions, WalletConnectActions } from 'src/walletConnect/actions'

export interface State {
  pendingActions: SessionTypes.RequestEvent[]
  pairings: PairingTypes.Created[]
  sessions: SessionTypes.Created[]
  pendingSessions: SessionTypes.Proposal[]
}

const initialState: State = {
  pairings: [],
  sessions: [],
  pendingSessions: [],
  pendingActions: [],
}

export const reducer = (
  state: State | undefined = initialState,
  action: WalletConnectActions | UserActions
): State => {
  switch (action.type) {
    // case Actions.PAIRING_PROPOSAL:
    case Actions.PAIRING_CREATED:
      return {
        ...state,
        pairings: [...state.pairings, action.pairing],
      }
    case Actions.PAIRING_UPDATED:
      return {
        ...state,
        pairings: state.pairings.map((p) => {
          if (p.topic === action.pairing.state) {
            return {
              ...p,
              state: action.pairing.state,
            }
          }
          return p
        }),
      }
    case Actions.PAIRING_DELETED:
      return {
        ...state,
        pairings: state.pairings.filter((p) => p.topic !== action.pairing.topic),
      }
    case Actions.SESSION_PROPOSAL:
      return {
        ...state,
        pendingSessions: [...state.pendingSessions, action.session],
      }
    case Actions.SESSION_PAYLOAD:
      return {
        ...state,
        pendingActions: [...state.pendingActions, action.request],
      }
    case Actions.ACCEPT_REQUEST:
    case Actions.DENY_REQUEST:
      console.log('DENY REQUEST', action)
      return {
        ...state,
        pendingActions: state.pendingActions.filter(
          (a) => a.request.id !== action.request.request.id && a.topic !== action.request.topic
        ),
      }
    case Actions.SESSION_CREATED:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter((s) => s.topic !== action.session.topic),
        sessions: [...state.sessions, action.session],
      }
    case Actions.SESSION_UPDATED:
      return {
        ...state,
        sessions: state.sessions.map((s) => {
          if (s.topic === action.session.topic) {
            return {
              ...s,
              state: {
                ...s.state,
                accounts: action.session.state.accounts!,
              },
            }
          }
          return s
        }),
      }

    case Actions.ACCEPT_SESSION:
    case Actions.DENY_SESSION:
    case Actions.CLOSE_SESSION:
    case Actions.SESSION_DELETED:
    case Actions.CLOSE_PENDING_SESSION:
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.topic !== action.session.topic),
        pendingSessions: state.pendingSessions.filter((s) => s.topic !== action.session.topic),
      }

    default:
      return state
  }
}
