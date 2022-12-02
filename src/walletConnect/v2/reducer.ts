import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { Actions, UserActions, WalletConnectActions } from 'src/walletConnect/v2/actions'

export interface State {
  pendingActions: SignClientTypes.EventArguments['session_request'][]
  sessions: SessionTypes.Struct[]
  pendingSessions: SignClientTypes.EventArguments['session_proposal'][]
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
    case Actions.SESSION_PROPOSAL_V2:
      return {
        ...state,
        pendingSessions: [...state.pendingSessions, action.session],
      }
    case Actions.SESSION_CREATED_V2:
      return {
        ...state,
        sessions: [...state.sessions, action.session],
      }
    case Actions.SESSION_UPDATED_V2:
      return {
        ...state,
        sessions: state.sessions.map((session) => {
          if (session.topic === action.session.topic) {
            return {
              ...session,
              // TODO figure out what the flip is meant to change here?
            }
          }
          return session
        }),
      }
    case Actions.ACCEPT_SESSION_V2:
    case Actions.DENY_SESSION_V2:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter(
          (pendingSession) => pendingSession.id !== action.session.id
        ),
        // to ensure a clean starting state, clear any actions that may be left
        // from a previous session
        pendingActions: state.pendingActions.filter(
          (pendingAction) => pendingAction.id !== action.session.id
        ),
      }
    case Actions.CLOSE_SESSION_V2:
    case Actions.SESSION_DELETED_V2:
      return {
        ...state,
        sessions: state.sessions.filter((session) => session.topic !== action.session.topic),
        pendingSessions: state.pendingSessions.filter(
          (pendingSession) => pendingSession.id !== action.session.id
        ),
        pendingActions: state.pendingActions.filter(
          (pendingAction) => pendingAction.topic !== action.session.topic
        ),
      }
    case Actions.SESSION_PAYLOAD_V2:
      return {
        ...state,
        pendingActions: [...state.pendingActions, action.request],
      }
    case Actions.ACCEPT_REQUEST_V2:
    case Actions.DENY_REQUEST_V2:
      return {
        ...state,
        pendingActions: state.pendingActions.filter(
          (pendingAction) =>
            pendingAction.id !== action.request.id && pendingAction.topic !== action.request.topic
        ),
      }
    case Actions.REMOVE_EXPIRED_SESSIONS_V2: {
      const unexpiredSessions = state.sessions.filter(
        (session) => session.expiry > action.dateInSeconds
      )
      return {
        sessions: unexpiredSessions,
        pendingActions: state.pendingActions.filter((pendingAction) =>
          unexpiredSessions
            .map((unexpiredSession) => unexpiredSession.topic)
            .includes(pendingAction.topic)
        ),
        pendingSessions: state.pendingSessions.filter(
          (pendingSession) => pendingSession.params.expiry > action.dateInSeconds
        ),
      }
    }
    default:
      return state
  }
}
