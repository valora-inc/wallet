import WalletConnectClient from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/walletConnect/actions'

export interface State {
  pendingActions: any[]
  client: WalletConnectClient | null
  sessions: SessionTypes.Created[]

  pairing: PairingTypes.Settled | null
}

const initialState: State = {
  client: null,
  pairing: null,
  sessions: [],
  pendingActions: [],
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case Actions.CLIENT_INITIALISED:
      return {
        ...state,
        client: action.client,
      }
    case Actions.PAIRING_PROPOSAL:
    case Actions.PAIRING_CREATED:
      // @ts-ignore
      state.pairing = action.pairing
      return state
    case Actions.PAIRING_UPDATED:
      state.pairing!.peer.metadata = action.pairing.peer.metadata
      return state
    case Actions.PAIRING_DELETED:
      return {
        ...state,
        pairing: null,
      }
    case Actions.SESSION_PROPOSAL:
      return {
        ...state,
        // @ts-ignore
        sessions: [...state.sessions, action.session],
      }
    case Actions.SESSION_PAYLOAD:
      return {
        ...state,
        pendingActions: [...state.pendingActions, action.session],
      }
    case Actions.SESSION_CREATED:
    case Actions.SESSION_UPDATED:
      // @ts-ignore
      const existing = state.sessions.ma((s) => s.topic === action.session.topic)
      if (existing) {
        return {
          ...state,
          // @ts-ignore
          sessions: state.sessions.map((s) =>
            // @ts-ignore
            s.topic === action.session.topic ? action.session : s
          ),
        }
      }
    case Actions.SESSION_DELETED:
      return {
        ...state,
        // @ts-ignore
        sessions: state.sessions.filter((s) => s.topic !== action.session.topic),
      }

    default:
      return state
  }
}
