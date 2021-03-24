import WalletConnectClient from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'

export enum Actions {
  INITIALISE_CLIENT = 'WALLETCONNECT/INITIALISE_CLIENT',
  INITIALISE_PAIRING = 'WALLETCONNECT/INITIALISE_CONNECTION',

  ACCEPT_SESSION = 'WALLETCONNECT/ACCEPT_SESSION',
  DENY_SESSION = 'WALLETCONNECT/DENY_SESSION',
  CLOSE_SESSION = 'WALLETCONNECT/CLOSE_SESSION',

  ACCEPT_REQUEST = 'WALLETCONNECT/ACCEPT_REQUEST',
  DENY_REQUEST = 'WALLETCONNECT/ACCEPT_REQUEST',

  CLIENT_INITIALISED = 'WALLETCONNECT/CLIENT_INITIALISED',

  SESSION_PROPOSAL = 'WALLETCONNECT/SESSION_PROPOSAL',
  SESSION_CREATED = 'WALLETCONNECT/SESSION_CREATED',
  SESSION_UPDATED = 'WALLETCONNECT/SESSION_UPDATED',
  SESSION_DELETED = 'WALLETCONNECT/SESSION_DELETED',
  SESSION_PAYLOAD = 'WALLETCONNECT/SESSION_PAYLOAD',

  PAIRING_PROPOSAL = 'WALLETCONNECT/PAIRING_PROPOSAL',
  PAIRING_CREATED = 'WALLETCONNECT/PAIRING_CREATED',
  PAIRING_UPDATED = 'WALLETCONNECT/PAIRING_UPDATED',
  PAIRING_DELETED = 'WALLETCONNECT/PAIRING_DELETED',
}

export interface ClientInitialised {
  type: Actions.CLIENT_INITIALISED
  client: WalletConnectClient
}
export interface InitialiseClient {
  type: Actions.INITIALISE_CLIENT
}

/**
 * Session objects
 */
export interface AcceptSession {
  type: Actions.ACCEPT_SESSION
  proposal: SessionTypes.Proposal
}
export interface DenySession {
  type: Actions.DENY_SESSION
  proposal: SessionTypes.Proposal
}
export interface CloseSession {
  type: Actions.CLOSE_SESSION
  session: SessionTypes.Settled
}

export interface AcceptRequest {
  type: Actions.ACCEPT_REQUEST
  request: SessionTypes.RequestParams
}
export interface DenyRequest {
  type: Actions.DENY_REQUEST
  request: SessionTypes.RequestParams
}

export interface InitialisePairing {
  type: Actions.INITIALISE_PAIRING
  uri: string
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
  session: SessionTypes.Update
}
export interface SessionDeleted {
  type: Actions.SESSION_DELETED
  session: SessionTypes.DeleteParams
}
export interface SessionPayload {
  type: Actions.SESSION_PAYLOAD
  request: SessionTypes.RequestEvent
}
export interface PairingProposal {
  type: Actions.PAIRING_PROPOSAL
  pairing: PairingTypes.Proposal
}
export interface PairingCreated {
  type: Actions.PAIRING_CREATED
  pairing: PairingTypes.Created
}
export interface PairingUpdated {
  type: Actions.PAIRING_UPDATED
  pairing: PairingTypes.Update
}
export interface PairingDeleted {
  type: Actions.PAIRING_DELETED
  pairing: PairingTypes.DeleteParams
}

export type ActionTypes =
  | InitialiseClient
  | InitialisePairing
  | ClientInitialised
  | SessionProposal
  | SessionCreated
  | SessionUpdated
  | SessionDeleted
  | SessionPayload
  | PairingProposal
  | PairingCreated
  | PairingUpdated
  | PairingDeleted

export const initialiseClient = (): InitialiseClient => ({
  type: Actions.INITIALISE_CLIENT,
})
export const initialisePairing = (uri: string): InitialisePairing => ({
  type: Actions.INITIALISE_PAIRING,
  uri,
})

export const acceptSession = (proposal: SessionTypes.Proposal): AcceptSession => ({
  type: Actions.ACCEPT_SESSION,
  proposal,
})
export const denySession = (proposal: SessionTypes.Proposal): DenySession => ({
  type: Actions.DENY_SESSION,
  proposal,
})
export const closeSession = (session: SessionTypes.Settled) => ({
  type: Actions.CLOSE_SESSION,
  session,
})

export const acceptRequest = (request: SessionTypes.RequestParams): AcceptRequest => ({
  type: Actions.ACCEPT_REQUEST,
  request,
})
export const denyRequest = (request: SessionTypes.RequestParams): DenyRequest => ({
  type: Actions.DENY_REQUEST,
  request,
})

export const clientInitialised = (client: WalletConnectClient) => ({
  type: Actions.CLIENT_INITIALISED,
  client,
})

export const sessionProposal = (session: SessionTypes.Proposal): SessionProposal => ({
  type: Actions.SESSION_PROPOSAL,
  session,
})
export const sessionCreated = (session: SessionTypes.Created) => ({
  type: Actions.SESSION_CREATED,
  session,
})
export const sessionUpdated = (session: SessionTypes.Update) => ({
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

export const pairingProposal = (pairing: PairingTypes.Proposal) => ({
  type: Actions.PAIRING_PROPOSAL,
  pairing,
})
export const pairingCreated = (pairing: PairingTypes.Created) => ({
  type: Actions.PAIRING_CREATED,
  pairing,
})
export const pairingUpdated = (pairing: PairingTypes.Update) => ({
  type: Actions.PAIRING_UPDATED,
  pairing,
})
export const pairingDeleted = (pairing: PairingTypes.DeleteParams) => ({
  type: Actions.PAIRING_DELETED,
  pairing,
})
