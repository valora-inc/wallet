import { JsonRpcTypes, SessionTypes, SignClientTypes } from '@walletconnect/types'
import { WalletConnectPairingOrigin } from 'src/analytics/types'

export enum Actions {
  /**
   * Actions coming as a result of user action
   */
  INITIALISE_CLIENT_V2 = 'WALLETCONNECT/INITIALISE_CLIENT_V2',
  INITIALISE_PAIRING_V2 = 'WALLETCONNECT/INITIALISE_PAIRING_V2',

  ACCEPT_SESSION_V2 = 'WALLETCONNECT/ACCEPT_SESSION_V2',
  DENY_SESSION_V2 = 'WALLETCONNECT/DENY_SESSION_V2',
  CLOSE_SESSION_V2 = 'WALLETCONNECT/CLOSE_SESSION_V2',
  CLOSE_PENDING_SESSION_V2 = 'WALLETCONNECT/CLOSE_PENDING_SESSION_V2',

  SHOW_REQUEST_DETAILS_V2 = 'WALLETCONNECT/SHOW_REQUEST_DETAILS_V2',
  ACCEPT_REQUEST_V2 = 'WALLETCONNECT/ACCEPT_REQUEST_V2',
  DENY_REQUEST_V2 = 'WALLETCONNECT/DENY_REQUEST_V2',
  REQUEST_FULFILLED_V2 = 'WALLETCONNECT/REQUEST_FULFILLED_V2',

  CLIENT_INITIALISED_V2 = 'WALLETCONNECT/CLIENT_INITIALISED_V2',
  CLIENT_DESTROYED_V2 = 'WALLETCONNECT/CLIENT_DESTROYED_V2',

  REMOVE_EXPIRED_SESSIONS_V2 = 'WALLETCONNECT/REMOVE_EXPIRED_SESSIONS_V2',

  /**
   * Actions coming from the WalletConnect client
   */
  SESSION_PROPOSAL_V2 = 'WALLETCONNECT/SESSION_PROPOSAL_V2',
  SESSION_CREATED_V2 = 'WALLETCONNECT/SESSION_CREATED_V2',
  SESSION_UPDATED_V2 = 'WALLETCONNECT/SESSION_UPDATED_V2',
  SESSION_DELETED_V2 = 'WALLETCONNECT/SESSION_DELETED_V2',
  SESSION_PAYLOAD_V2 = 'WALLETCONNECT/SESSION_PAYLOAD_V2',
}

export interface InitialiseClient {
  type: Actions.INITIALISE_CLIENT_V2
}
export interface ClientInitialised {
  type: Actions.CLIENT_INITIALISED_V2
}
export interface ClientDestroyed {
  type: Actions.CLIENT_DESTROYED_V2
}

/**
 * Session objects
 */
export interface AcceptSession {
  type: Actions.ACCEPT_SESSION_V2
  session: SignClientTypes.EventArguments['session_proposal']
}

export interface DenySession {
  type: Actions.DENY_SESSION_V2
  session: SignClientTypes.EventArguments['session_proposal']
}
export interface CloseSession {
  type: Actions.CLOSE_SESSION_V2
  session: SignClientTypes.EventArguments['session_delete']
}
export interface ShowRequestDetails {
  type: Actions.SHOW_REQUEST_DETAILS_V2
  request: SignClientTypes.EventArguments['session_request']
  infoString: string
}
export interface AcceptRequest {
  type: Actions.ACCEPT_REQUEST_V2
  request: SignClientTypes.EventArguments['session_request']
}
export interface DenyRequest {
  type: Actions.DENY_REQUEST_V2
  request: SignClientTypes.EventArguments['session_request']
  reason: JsonRpcTypes.Error
}

export interface RemoveExpiredSessions {
  type: Actions.REMOVE_EXPIRED_SESSIONS_V2
  date: number
}

export interface InitialisePairing {
  type: Actions.INITIALISE_PAIRING_V2
  uri: string
  origin: WalletConnectPairingOrigin
}

export interface SessionProposal {
  type: Actions.SESSION_PROPOSAL_V2
  session: SignClientTypes.EventArguments['session_proposal']
}
export interface SessionCreated {
  type: Actions.SESSION_CREATED_V2
  session: SessionTypes.Struct
}
export interface SessionUpdated {
  type: Actions.SESSION_UPDATED_V2
  session: SignClientTypes.EventArguments['session_update']
}
export interface SessionDeleted {
  type: Actions.SESSION_DELETED_V2
  session: SignClientTypes.EventArguments['session_delete']
}
export interface SessionPayload {
  type: Actions.SESSION_PAYLOAD_V2
  request: SignClientTypes.EventArguments['session_request']
}

export type WalletConnectActions =
  | SessionProposal
  | SessionCreated
  | SessionUpdated
  | SessionDeleted
  | SessionPayload

export type UserActions =
  | InitialiseClient
  | InitialisePairing
  | ClientInitialised
  | ClientDestroyed
  | AcceptSession
  | DenySession
  | CloseSession
  | ShowRequestDetails
  | AcceptRequest
  | DenyRequest
  | RemoveExpiredSessions

export const initialiseClient = (): InitialiseClient => ({
  type: Actions.INITIALISE_CLIENT_V2,
})

export const initialisePairing = (
  uri: string,
  origin: WalletConnectPairingOrigin
): InitialisePairing => ({
  type: Actions.INITIALISE_PAIRING_V2,
  uri,
  origin,
})

export const acceptSession = (
  session: SignClientTypes.EventArguments['session_proposal']
): AcceptSession => ({
  type: Actions.ACCEPT_SESSION_V2,
  session,
})

export const denySession = (
  session: SignClientTypes.EventArguments['session_proposal']
): DenySession => ({
  type: Actions.DENY_SESSION_V2,
  session,
})

export const closeSession = (
  session: SignClientTypes.EventArguments['session_delete']
): CloseSession => ({
  type: Actions.CLOSE_SESSION_V2,
  session,
})

export const showRequestDetails = (
  request: SignClientTypes.EventArguments['session_request'],
  infoString: string
): ShowRequestDetails => ({
  type: Actions.SHOW_REQUEST_DETAILS_V2,
  request,
  infoString,
})

export const acceptRequest = (
  request: SignClientTypes.EventArguments['session_request']
): AcceptRequest => ({
  type: Actions.ACCEPT_REQUEST_V2,
  request,
})

export const denyRequest = (
  request: SignClientTypes.EventArguments['session_request'],
  reason: JsonRpcTypes.Error
): DenyRequest => ({
  type: Actions.DENY_REQUEST_V2,
  request,
  reason,
})

export const removeExpiredSessions = (date: number): RemoveExpiredSessions => ({
  type: Actions.REMOVE_EXPIRED_SESSIONS_V2,
  date,
})

export const clientInitialised = (): ClientInitialised => ({
  type: Actions.CLIENT_INITIALISED_V2,
})

export const clientDestroyed = (): ClientDestroyed => ({
  type: Actions.CLIENT_DESTROYED_V2,
})

export const sessionProposal = (
  session: SignClientTypes.EventArguments['session_proposal']
): SessionProposal => ({
  type: Actions.SESSION_PROPOSAL_V2,
  session,
})

export const sessionCreated = (session: SessionTypes.Struct): SessionCreated => ({
  type: Actions.SESSION_CREATED_V2,
  session,
})

export const sessionUpdated = (
  session: SignClientTypes.EventArguments['session_update']
): SessionUpdated => ({
  type: Actions.SESSION_UPDATED_V2,
  session,
})

export const sessionDeleted = (
  session: SignClientTypes.EventArguments['session_delete']
): SessionDeleted => ({
  type: Actions.SESSION_DELETED_V2,
  session,
})

export const sessionPayload = (
  request: SignClientTypes.EventArguments['session_request']
): SessionPayload => ({
  type: Actions.SESSION_PAYLOAD_V2,
  request,
})
