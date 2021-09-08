import { SessionTypes } from '@walletconnect/types-v2'
import { WalletConnectPairingOrigin } from 'src/analytics/types'

export enum Actions {
  /**
   * Actions coming as a result of user action
   */
  INITIALISE_CLIENT = 'WALLETCONNECT/INITIALISE_CLIENT',
  INITIALISE_PAIRING = 'WALLETCONNECT/INITIALISE_CONNECTION',

  ACCEPT_SESSION = 'WALLETCONNECT/ACCEPT_SESSION',
  DENY_SESSION = 'WALLETCONNECT/DENY_SESSION',
  CLOSE_SESSION = 'WALLETCONNECT/CLOSE_SESSION',
  CLOSE_PENDING_SESSION = 'WALLETCONNECT/CLOSE_PENDING_SESSION',

  ACCEPT_REQUEST = 'WALLETCONNECT/ACCEPT_REQUEST',
  DENY_REQUEST = 'WALLETCONNECT/DENY_REQUEST',
  REQUEST_FULFILLED = 'WALLETCONNECT/REQUEST_FULFILLED',

  CLIENT_INITIALISED = 'WALLETCONNECT/CLIENT_INITIALISED',
  CLIENT_DESTROYED = 'WALLETCONNECT/CLIENT_DESTROYED',

  /**
   * Actions coming from the WalletConnect client
   */
  SESSION_PROPOSAL = 'WALLETCONNECT/SESSION_PROPOSAL',
  SESSION_CREATED = 'WALLETCONNECT/SESSION_CREATED',
  SESSION_UPDATED = 'WALLETCONNECT/SESSION_UPDATED',
  SESSION_DELETED = 'WALLETCONNECT/SESSION_DELETED',
  SESSION_PAYLOAD = 'WALLETCONNECT/SESSION_PAYLOAD',
}

export interface InitialiseClient {
  type: Actions.INITIALISE_CLIENT
}
export interface ClientInitialised {
  type: Actions.CLIENT_INITIALISED
}
export interface ClientDestroyed {
  type: Actions.CLIENT_DESTROYED
}

/**
 * Session objects
 */
export interface AcceptSession {
  type: Actions.ACCEPT_SESSION
  session: SessionTypes.Proposal
}
export interface DenySession {
  type: Actions.DENY_SESSION
  session: SessionTypes.Proposal
}
export interface CloseSession {
  type: Actions.CLOSE_SESSION
  session: SessionTypes.Settled
}

export interface AcceptRequest {
  type: Actions.ACCEPT_REQUEST
  request: SessionTypes.RequestEvent
}
export interface DenyRequest {
  type: Actions.DENY_REQUEST
  request: SessionTypes.RequestEvent
}

export interface InitialisePairing {
  type: Actions.INITIALISE_PAIRING
  uri: string
  origin: WalletConnectPairingOrigin
}

export interface SessionProposal {
  type: Actions.SESSION_PROPOSAL
  session: SessionTypes.Proposal
}
export interface SessionCreated {
  type: Actions.SESSION_CREATED
  session: SessionTypes.Created
}
export interface SessionUpdated {
  type: Actions.SESSION_UPDATED
  session: SessionTypes.UpdateParams
}
export interface SessionDeleted {
  type: Actions.SESSION_DELETED
  session: SessionTypes.DeleteParams
}
export interface SessionPayload {
  type: Actions.SESSION_PAYLOAD
  request: SessionTypes.RequestEvent
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
  | AcceptRequest
  | DenyRequest

export const initialiseClient = (): InitialiseClient => ({
  type: Actions.INITIALISE_CLIENT,
})
export const initialisePairing = (
  uri: string,
  origin: WalletConnectPairingOrigin
): InitialisePairing => ({
  type: Actions.INITIALISE_PAIRING,
  uri,
  origin,
})
export const acceptSession = (session: SessionTypes.Proposal): AcceptSession => ({
  type: Actions.ACCEPT_SESSION,
  session,
})
export const denySession = (session: SessionTypes.Proposal): DenySession => ({
  type: Actions.DENY_SESSION,
  session,
})
export const closeSession = (session: { topic: string }) => ({
  type: Actions.CLOSE_SESSION,
  session,
})

export const acceptRequest = (request: SessionTypes.RequestEvent): AcceptRequest => ({
  type: Actions.ACCEPT_REQUEST,
  request,
})
export const denyRequest = (request: SessionTypes.RequestEvent): DenyRequest => ({
  type: Actions.DENY_REQUEST,
  request,
})

export const clientInitialised = () => ({
  type: Actions.CLIENT_INITIALISED,
})
export const clientDestroyed = () => ({
  type: Actions.CLIENT_DESTROYED,
})

export const sessionProposal = (session: SessionTypes.Proposal): SessionProposal => ({
  type: Actions.SESSION_PROPOSAL,
  session,
})
export const sessionCreated = (session: SessionTypes.Created): SessionCreated => ({
  type: Actions.SESSION_CREATED,
  session,
})
export const sessionUpdated = (session: SessionTypes.UpdateParams) => ({
  type: Actions.SESSION_UPDATED,
  session,
})
export const sessionDeleted = (session: SessionTypes.DeleteParams) => ({
  type: Actions.SESSION_DELETED,
  session,
})
export const sessionPayload = (request: SessionTypes.RequestEvent): SessionPayload => ({
  type: Actions.SESSION_PAYLOAD,
  request,
})
