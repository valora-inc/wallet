import { IClientMeta } from 'walletconnect-v1/types'
import { SessionTypes } from 'walletconnect-v2/types'

export interface WalletConnectSessionRequest {
  id: number
  jsonrpc: string
  method: string
  uri?: string
  params: {
    peerId: string
    peerMeta: { name: string; description: string; url: string; icons: string[] }
    chainId: number
  }[]
}

export interface WalletConnectSession {
  connected: boolean
  accounts: string[]
  chainId: number
  bridge: string
  key: string
  clientId: string
  clientMeta: IClientMeta | null
  peerId: string
  peerMeta: IClientMeta | null
  handshakeId: number
  handshakeTopic: string
}

export interface WalletConnectPayloadRequest {
  id: number
  jsonrpc: string
  method: string
  params: any
}

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
