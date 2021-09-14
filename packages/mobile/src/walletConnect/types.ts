import { IClientMeta } from '@walletconnect/types'

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
