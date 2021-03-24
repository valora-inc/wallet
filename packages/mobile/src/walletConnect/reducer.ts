import WalletConnectClient from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/walletConnect/actions'

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
  action: ActionTypes | RehydrateAction
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

    // case Actions.PAIRING_PROPOSAL:
    case Actions.PAIRING_CREATED:
      return {
        ...state,
        pairings: [...state.pairings, action.pairing],
      }
    case Actions.PAIRING_UPDATED:
      return {
        ...state,
        pairings: [], // state.pairings.map(p => p.topic === action.pairing.state.,
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
    case Actions.SESSION_CREATED:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter((s) => s.topic !== action.session.topic),
        sessions: [...state.sessions, action.session],
      }
    case Actions.SESSION_UPDATED:
      return {
        ...state,
        // @ts-ignore
        sessions: state.sessions.map((s) => {
          // @ts-ignore
          if (s.topic === action.session.topic) {
            return {
              ...s,
              state: action.session.state,
            }
          }
          return s
        }),
      }
    case Actions.SESSION_DELETED:
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.topic !== action.session.topic),
      }

    default:
      return state
  }
}
