import { Actions, UserActions, WalletConnectActions } from 'src/walletConnect/v2/actions'
import { SessionTypes } from 'walletconnect-v2/types'

export interface State {
  pendingActions: SessionTypes.RequestEvent[]
  sessions: SessionTypes.Created[]
  pendingSessions: SessionTypes.Proposal[]
}

const initialState: State = {
  sessions: [],
  pendingSessions: [],
  pendingActions: [],
}

export const reducer = (
  state: State | undefined = initialState,
  action: WalletConnectActions | UserActions
): State => {
  switch (action.type) {
    case Actions.SESSION_PROPOSAL:
      return {
        ...state,
        pendingSessions: [...state.pendingSessions, action.session],
      }
    case Actions.SESSION_CREATED:
      return {
        ...state,
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
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.topic !== action.session.topic),
        pendingSessions: state.pendingSessions.filter((s) => s.topic !== action.session.topic),
        pendingActions: state.pendingActions.filter((a) => a.topic !== action.session.topic),
      }

    case Actions.SESSION_PAYLOAD:
      return {
        ...state,
        pendingActions: [...state.pendingActions, action.request],
      }
    case Actions.ACCEPT_REQUEST:
    case Actions.DENY_REQUEST:
      return {
        ...state,
        pendingActions: state.pendingActions.filter(
          (a) => a.request.id !== action.request.request.id && a.topic !== action.request.topic
        ),
      }

    default:
      return state
  }
}
