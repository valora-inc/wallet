import { SessionTypes } from '@walletconnect/types'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { Actions, UserActions, WalletConnectActions } from 'src/walletConnect/actions'

interface State {
  pendingActions: Web3WalletTypes.EventArguments['session_request'][]
  sessions: SessionTypes.Struct[]
  pendingSessions: Web3WalletTypes.EventArguments['session_proposal'][]
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
    case Actions.ACCEPT_SESSION:
    case Actions.DENY_SESSION:
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
    case Actions.SESSION_DELETED:
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
    case Actions.CLOSE_SESSION:
      return {
        ...state,
        sessions: state.sessions.filter((session) => session.topic !== action.session.topic),
        pendingActions: state.pendingActions.filter(
          (pendingAction) => pendingAction.topic !== action.session.topic
        ),
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
          (pendingAction) =>
            pendingAction.id !== action.request.id && pendingAction.topic !== action.request.topic
        ),
      }
    case Actions.REMOVE_EXPIRED_SESSIONS: {
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
