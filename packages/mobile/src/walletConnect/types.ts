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

export interface WalletConnectPayloadRequest {
  id: number
  jsonrpc: string
  method: string
  params: any
}
