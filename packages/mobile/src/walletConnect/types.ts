import { IClientMeta, IJsonRpcSubscription, IWalletConnectSession } from 'walletconnect-v1/types'
import { SessionTypes } from 'walletconnect-v2/types'

export interface WalletConnectSessionRequest {
  id: number
  jsonrpc: string
  method: string
  uri?: string
  params: {
    peerId: string
    peerMeta: IClientMeta
    chainId: number
  }[]
}

export type WalletConnectSession = IWalletConnectSession

export type WalletConnectPayloadRequest = IJsonRpcSubscription

export type PendingAction =
  | { version: 1; action: WalletConnectPayloadRequest; peerId: string }
  | {
      version: 2
      action: SessionTypes.RequestEvent
    }

export type Session =
  | {
      version: 1
      session: WalletConnectSession
    }
  | {
      version: 2
      session: SessionTypes.Created
    }

export type PendingSession =
  | {
      version: 1
      session: WalletConnectSessionRequest
    }
  | {
      version: 2
      session: SessionTypes.Proposal
    }
