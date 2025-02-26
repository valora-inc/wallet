import { WalletKitTypes } from '@reown/walletkit'
import { JsonRpcTypes, SessionTypes } from '@walletconnect/types'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

export enum Actions {
  /**
   * Actions coming as a result of user action
   */
  INITIALISE_CLIENT = 'WALLETCONNECT/INITIALISE_CLIENT',
  INITIALISE_PAIRING = 'WALLETCONNECT/INITIALISE_PAIRING',

  ACCEPT_SESSION = 'WALLETCONNECT/ACCEPT_SESSION',
  DENY_SESSION = 'WALLETCONNECT/DENY_SESSION',
  CLOSE_SESSION = 'WALLETCONNECT/CLOSE_SESSION',
  CLOSE_PENDING_SESSION = 'WALLETCONNECT/CLOSE_PENDING_SESSION',

  SHOW_REQUEST_DETAILS = 'WALLETCONNECT/SHOW_REQUEST_DETAILS',
  ACCEPT_REQUEST = 'WALLETCONNECT/ACCEPT_REQUEST',
  DENY_REQUEST = 'WALLETCONNECT/DENY_REQUEST',
  REQUEST_FULFILLED = 'WALLETCONNECT/REQUEST_FULFILLED',

  CLIENT_INITIALISED = 'WALLETCONNECT/CLIENT_INITIALISED',
  CLIENT_DESTROYED = 'WALLETCONNECT/CLIENT_DESTROYED',

  REMOVE_EXPIRED_SESSIONS = 'WALLETCONNECT/REMOVE_EXPIRED_SESSIONS',

  /**
   * Actions coming from the WalletConnect client
   */
  SESSION_PROPOSAL = 'WALLETCONNECT/SESSION_PROPOSAL',
  SESSION_CREATED = 'WALLETCONNECT/SESSION_CREATED',
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
  session: WalletKitTypes.EventArguments['session_proposal']
  approvedNamespaces: SessionTypes.Namespaces
}

export interface DenySession {
  type: Actions.DENY_SESSION
  session: WalletKitTypes.EventArguments['session_proposal']
  reason: JsonRpcTypes.Error
}
export interface CloseSession {
  type: Actions.CLOSE_SESSION
  session: SessionTypes.Struct
}
export interface ShowRequestDetails {
  type: Actions.SHOW_REQUEST_DETAILS
  request: WalletKitTypes.EventArguments['session_request']
  infoString: string
}
export interface AcceptRequest {
  type: Actions.ACCEPT_REQUEST
  request: WalletKitTypes.EventArguments['session_request']
  preparedTransaction?: SerializableTransactionRequest
}
export interface DenyRequest {
  type: Actions.DENY_REQUEST
  request: WalletKitTypes.EventArguments['session_request']
  reason: JsonRpcTypes.Error
}

export interface RemoveExpiredSessions {
  type: Actions.REMOVE_EXPIRED_SESSIONS
  dateInSeconds: number
}

export interface InitialisePairing {
  type: Actions.INITIALISE_PAIRING
  uri: string
  origin: WalletConnectPairingOrigin
}

export interface SessionProposal {
  type: Actions.SESSION_PROPOSAL
  session: WalletKitTypes.EventArguments['session_proposal']
}
export interface SessionCreated {
  type: Actions.SESSION_CREATED
  session: SessionTypes.Struct
}

export interface SessionDeleted {
  type: Actions.SESSION_DELETED
  session: WalletKitTypes.EventArguments['session_delete']
}
export interface SessionPayload {
  type: Actions.SESSION_PAYLOAD
  request: WalletKitTypes.EventArguments['session_request']
}

export type WalletConnectActions =
  | SessionProposal
  | SessionCreated
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

export const acceptSession = (
  session: WalletKitTypes.EventArguments['session_proposal'],
  approvedNamespaces: SessionTypes.Namespaces
): AcceptSession => ({
  type: Actions.ACCEPT_SESSION,
  session,
  approvedNamespaces,
})

export const denySession = (
  session: WalletKitTypes.EventArguments['session_proposal'],
  reason: JsonRpcTypes.Error
): DenySession => ({
  type: Actions.DENY_SESSION,
  session,
  reason,
})

export const closeSession = (session: SessionTypes.Struct): CloseSession => ({
  type: Actions.CLOSE_SESSION,
  session,
})

export const showRequestDetails = (
  request: WalletKitTypes.EventArguments['session_request'],
  infoString: string
): ShowRequestDetails => ({
  type: Actions.SHOW_REQUEST_DETAILS,
  request,
  infoString,
})

export const acceptRequest = (
  request: WalletKitTypes.EventArguments['session_request'],
  preparedTransaction?: SerializableTransactionRequest
): AcceptRequest => ({
  type: Actions.ACCEPT_REQUEST,
  request,
  preparedTransaction,
})

export const denyRequest = (
  request: WalletKitTypes.EventArguments['session_request'],
  reason: JsonRpcTypes.Error
): DenyRequest => ({
  type: Actions.DENY_REQUEST,
  request,
  reason,
})

export const removeExpiredSessions = (dateInSeconds: number): RemoveExpiredSessions => ({
  type: Actions.REMOVE_EXPIRED_SESSIONS,
  dateInSeconds,
})

export const clientInitialised = (): ClientInitialised => ({
  type: Actions.CLIENT_INITIALISED,
})

export const clientDestroyed = (): ClientDestroyed => ({
  type: Actions.CLIENT_DESTROYED,
})

export const sessionProposal = (
  session: WalletKitTypes.EventArguments['session_proposal']
): SessionProposal => ({
  type: Actions.SESSION_PROPOSAL,
  session,
})

export const sessionCreated = (session: SessionTypes.Struct): SessionCreated => ({
  type: Actions.SESSION_CREATED,
  session,
})

export const sessionDeleted = (
  session: WalletKitTypes.EventArguments['session_delete']
): SessionDeleted => ({
  type: Actions.SESSION_DELETED,
  session,
})

export const sessionPayload = (
  request: WalletKitTypes.EventArguments['session_request']
): SessionPayload => ({
  type: Actions.SESSION_PAYLOAD,
  request,
})
