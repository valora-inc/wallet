import WalletConnectClient from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { Actions, UserActions, WalletConnectActions } from 'src/walletConnect/actions'

export interface State {
  pendingActions: SessionTypes.RequestEvent[]
  client: WalletConnectClient | null
  pairings: PairingTypes.Created[]
  sessions: SessionTypes.Created[]
  pendingSessions: SessionTypes.Proposal[]
  pendingConnections: string[]
}

const initialState: State = {
  client: null,
  pairings: [],
  sessions: [],
  pendingSessions: [],
  pendingActions: [],
  pendingConnections: [],
}

export const reducer = (
  state: State | undefined = initialState,
  action: WalletConnectActions | UserActions
): State => {
  switch (action.type) {
    case Actions.INITIALISE_PAIRING:
      return {
        ...state,
        pendingConnections: [...state.pendingConnections, action.uri],
      }
    case Actions.CLIENT_INITIALISED:
      return {
        ...state,
        client: action.client,
      }
    case Actions.CLIENT_DESTROYED:
      return {
        ...state,
        client: null,
      }

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
    case Actions.REQUEST_FULFILLED:
      return {
        ...state,
        pendingActions: state.pendingActions.filter(
          (a) => a.request.id !== action.request.id && a.topic !== action.request.topic
        ),
      }
    case Actions.SESSION_CREATED:
      return {
        ...state,
        // @ts-ignore
        pendingSessions: state.pendingSessions.filter((s) => s.topic !== action.session.topic),
        sessions: state.client!.session.values,
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
    case Actions.SESSION_DELETED:
      return {
        ...state,
        sessions: state.client!.session.values,
      }

    default:
      return state
  }
}
