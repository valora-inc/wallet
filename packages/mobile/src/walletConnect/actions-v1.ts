import {} from '@walletconnect/client-v1'

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
  session: any
}
export interface DenySession {
  type: Actions.DENY_SESSION_V1
  session: any
}
export interface CloseSession {
  type: Actions.CLOSE_SESSION_V1
  session: any
}

export interface AcceptRequest {
  type: Actions.ACCEPT_REQUEST_V1
  request: any
}
export interface DenyRequest {
  type: Actions.DENY_REQUEST_V1
  request: any
}

export interface SessionRequest {
  type: Actions.SESSION_V1
  session: any
}
export interface PayloadRequest {
  type: Actions.PAYLOAD_V1
  request: any
}

export type WalletConnectActions = SessionRequest | PayloadRequest

export type UserActions = AcceptSession | DenySession | CloseSession | AcceptRequest | DenyRequest

export const initialiseConnection = (uri: string): InitialiseConnection => ({
  type: Actions.INITIALISE_CONNECTION_V1,
  uri,
})

export const acceptSession = (session: any): AcceptSession => ({
  type: Actions.ACCEPT_SESSION_V1,
  session,
})
export const denySession = (session: any): DenySession => ({
  type: Actions.DENY_SESSION_V1,
  session,
})
export const closeSession = (session: any) => ({
  type: Actions.CLOSE_SESSION_V1,
  session,
})

export const acceptRequest = (request: any): AcceptRequest => ({
  type: Actions.ACCEPT_REQUEST_V1,
  request,
})
export const denyRequest = (request: any): DenyRequest => ({
  type: Actions.DENY_REQUEST_V1,
  request,
})

export const sessionRequest = (session: any): SessionRequest => ({
  type: Actions.SESSION_V1,
  session,
})
export const payloadRequest = (request: any): PayloadRequest => ({
  type: Actions.PAYLOAD_V1,
  request,
})
