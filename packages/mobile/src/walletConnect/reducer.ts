import { SessionTypes } from '@walletconnect/types-v2'
import {
  Actions as ActionsV1,
  UserActions as UserActionsV1,
  WalletConnectActions as WalletConnectActionsV1,
} from 'src/walletConnect/actions-v1'
import {
  Actions as ActionsV2,
  UserActions as UserActionsV2,
  WalletConnectActions as WalletConnectActionsV2,
} from 'src/walletConnect/actions-v2'
import { WalletConnectPayloadRequest, WalletConnectSessionRequest } from 'src/walletConnect/types'

export type PendingAction =
  | { isV1: true; action: WalletConnectPayloadRequest; peerId: string }
  | {
      isV1: false
      action: SessionTypes.RequestEvent
    }

export type Session =
  | {
      isV1: true
      session: WalletConnectSessionRequest
    }
  | {
      isV1: false
      session: SessionTypes.Created
    }

export type PendingSession =
  | {
      isV1: true
      session: WalletConnectSessionRequest
    }
  | {
      isV1: false
      session: SessionTypes.Proposal
    }
export interface State {
  pendingActions: PendingAction[]
  sessions: Session[]
  pendingSessions: PendingSession[]
}

const initialState: State = {
  pendingActions: [],
  sessions: [],
  pendingSessions: [],
}

export const reducer = (
  state: State | undefined = initialState,
  action: WalletConnectActionsV1 | WalletConnectActionsV2 | UserActionsV1 | UserActionsV2
): State => {
  switch (action.type) {
    // V1
    case ActionsV1.SESSION_V1:
      return {
        ...state,
        pendingSessions: [...state.pendingSessions, { isV1: true, session: action.session }],
      }
    case ActionsV1.SESSION_DELETED_V1:
      return {
        ...state,
        sessions: state.sessions.filter((s) =>
          s.isV1 ? s.session.params[0].peerId !== action.peerId : true
        ),
      }
    case ActionsV1.ACCEPT_SESSION_V1:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter((s) => !s.isV1),
        sessions: [...state.sessions, { isV1: true, session: action.session }],
      }
    case ActionsV1.DENY_SESSION_V1:
      return {
        ...state,
        pendingSessions: state.pendingSessions.filter((s) => !s.isV1),
      }
    case ActionsV1.CLOSE_SESSION_V1:
      return {
        ...state,
        sessions: state.sessions.filter((s) => !s.isV1),
      }
    case ActionsV1.PAYLOAD_V1:
      return {
        ...state,
        pendingActions: [
          ...state.pendingActions,
          { isV1: true, action: action.request, peerId: action.peerId },
        ],
      }
    case ActionsV1.ACCEPT_REQUEST_V1:
    case ActionsV1.DENY_REQUEST_V1:
      return {
        ...state,
        pendingActions: state.pendingActions.filter((a) => a.action !== action.request),
      }

    // V2
    case ActionsV2.SESSION_PROPOSAL:
      return {
        ...state,
        pendingSessions: [...state.pendingSessions, { isV1: false, session: action.session }],
      }

    case ActionsV2.SESSION_CREATED:
      return {
        ...state,
        sessions: [...state.sessions, { isV1: false, session: action.session }],
      }

    case ActionsV2.SESSION_UPDATED:
      return {
        ...state,
        sessions: state.sessions.map((s) => {
          if (s.isV1) return s
          if (s.session.topic === action.session.topic) {
            return {
              ...s,
              state: {
                ...s.session,
                accounts: action.session.state.accounts!,
              },
            }
          }
          return s
        }),
      }
    case ActionsV2.ACCEPT_SESSION:
    case ActionsV2.DENY_SESSION:
    case ActionsV2.CLOSE_SESSION:
    case ActionsV2.SESSION_DELETED:
      return {
        ...state,
        sessions: state.sessions.filter((s) => !s.isV1 && s.session.topic !== action.session.topic),
        pendingSessions: state.pendingSessions.filter(
          (s) => !s.isV1 && s.session.topic !== action.session.topic
        ),
        pendingActions: state.pendingActions.filter(
          (a) => !a.isV1 && a.action.topic !== action.session.topic
        ),
      }

    case ActionsV2.SESSION_PAYLOAD:
      return {
        ...state,
        pendingActions: [...state.pendingActions, { isV1: false, action: action.request }],
      }
    case ActionsV2.ACCEPT_REQUEST:
    case ActionsV2.DENY_REQUEST:
      return {
        ...state,
        pendingActions: state.pendingActions.filter(
          (a) =>
            a.isV1 === false &&
            a.action.request.id !== action.request.request.id &&
            a.action.topic !== action.request.topic
        ),
      }

    default:
      return state
  }
}
