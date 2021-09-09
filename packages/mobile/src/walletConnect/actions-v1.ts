import { WalletConnectPayloadRequest, WalletConnectSessionRequest } from 'src/walletConnect/types'

export enum Actions {
  /**
   * Actions coming as a result of user action
   */
  INITIALISE_CONNECTION_V1 = 'WALLETCONNECT/INITIALISE_CONNECTION_V1',

  ACCEPT_SESSION_V1 = 'WALLETCONNECT/ACCEPT_SESSION_V1',
  DENY_SESSION_V1 = 'WALLETCONNECT/DENY_SESSION_V1',
  CLOSE_SESSION_V1 = 'WALLETCONNECT/CLOSE_SESSION_V1',

  ACCEPT_REQUEST_V1 = 'WALLETCONNECT/ACCEPT_REQUEST_V1',
  DENY_REQUEST_V1 = 'WALLETCONNECT/DENY_REQUEST_V1',
  REQUEST_HANDLED_V1 = 'WALLETCONNECT/REQUEST_HANDLED_V1',

  /**
   * Actions coming from the WalletConnect client
   */
  SESSION_V1 = 'WALLETCONNECT/SESSION_V1',
  SESSION_DELETED_V1 = 'WALLETCONNECT/SESSION_DELETED_V1',
  PAYLOAD_V1 = 'WALLETCONNECT/REQUEST_V1',
}

export interface InitialiseConnection {
  type: Actions.INITIALISE_CONNECTION_V1
  uri: string
}

/**
 * Session objects
 */
export interface AcceptSession {
  type: Actions.ACCEPT_SESSION_V1
  session: WalletConnectSessionRequest
}
export interface DenySession {
  type: Actions.DENY_SESSION_V1
  session: WalletConnectSessionRequest
}
export interface CloseSession {
  type: Actions.CLOSE_SESSION_V1
  session: WalletConnectSessionRequest
}

export interface AcceptRequest {
  type: Actions.ACCEPT_REQUEST_V1
  request: WalletConnectPayloadRequest
  peerId: string
}
export interface DenyRequest {
  type: Actions.DENY_REQUEST_V1
  request: WalletConnectPayloadRequest
  peerId: string
}

export interface SessionRequest {
  type: Actions.SESSION_V1
  session: WalletConnectSessionRequest
}
export interface SessionDeleted {
  type: Actions.SESSION_DELETED_V1
  peerId: string
}
export interface PayloadRequest {
  type: Actions.PAYLOAD_V1
  peerId: string
  request: WalletConnectPayloadRequest
}

export type WalletConnectActions = SessionRequest | PayloadRequest

export type UserActions =
  | AcceptSession
  | DenySession
  | SessionDeleted
  | CloseSession
  | AcceptRequest
  | DenyRequest

export const initialiseConnection = (uri: string): InitialiseConnection => ({
  type: Actions.INITIALISE_CONNECTION_V1,
  uri,
})

export const acceptSession = (session: WalletConnectSessionRequest): AcceptSession => ({
  type: Actions.ACCEPT_SESSION_V1,
  session,
})
export const denySession = (session: WalletConnectSessionRequest): DenySession => ({
  type: Actions.DENY_SESSION_V1,
  session,
})
export const closeSession = (session: any) => ({
  type: Actions.CLOSE_SESSION_V1,
  session,
})

export const acceptRequest = (peerId: string, request: any): AcceptRequest => ({
  type: Actions.ACCEPT_REQUEST_V1,
  request,
  peerId,
})
export const denyRequest = (peerId: string, request: any): DenyRequest => ({
  type: Actions.DENY_REQUEST_V1,
  request,
  peerId,
})

export const sessionRequest = (session: WalletConnectSessionRequest): SessionRequest => ({
  type: Actions.SESSION_V1,
  session,
})
export const sessionDeleted = (peerId: string): SessionDeleted => ({
  type: Actions.SESSION_DELETED_V1,
  peerId,
})
export const payloadRequest = (
  peerId: string,
  request: WalletConnectPayloadRequest
): PayloadRequest => ({
  type: Actions.PAYLOAD_V1,
  peerId,
  request,
})
