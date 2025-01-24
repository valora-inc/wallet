import {
  IClientMeta,
  IJsonRpcSubscription,
  IWalletConnectSession,
} from '@walletconnect/legacy-types'

export interface WalletConnectSessionRequest {
  id: number
  jsonrpc: string
  method: string
  uri?: string
  params: {
    peerId: string
    peerMeta: IClientMeta
    chainId: number | null
  }[]
}

export type WalletConnectSession = IWalletConnectSession

export type WalletConnectPayloadRequest = IJsonRpcSubscription

export type PendingAction = { version: 1; action: WalletConnectPayloadRequest; peerId: string }

export type Session = {
  version: 1
  session: WalletConnectSession
}

export type PendingSession = {
  version: 1
  session: WalletConnectSessionRequest
}

export enum WalletConnectRequestType {
  Loading,
  Session,
  Action,
  TimeOut,
}
