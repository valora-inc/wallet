export interface TokenBridge {
  status: TokenBridgeStatus
  originTokenAddress: string
  destinationTokenAddress: string
  amount: string // with full decimals
  destinationAddress: string
  transactionHash: string
}

export enum TokenBridgeStatus {
  Complete = 'Complete',
  InProgress = 'InProgress',
}
