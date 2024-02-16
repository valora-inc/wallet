import BigNumber from 'bignumber.js'
import { Nft } from 'src/nfts/types'
import { v4 as uuidv4 } from 'uuid'

export enum Network {
  Celo = 'celo',
  Ethereum = 'ethereum',
  Arbitrum = 'arbitrum',
  Optimism = 'optimism',
}

export enum NetworkId {
  'celo-mainnet' = 'celo-mainnet',
  'celo-alfajores' = 'celo-alfajores',
  'ethereum-mainnet' = 'ethereum-mainnet',
  'ethereum-sepolia' = 'ethereum-sepolia',
  'arbitrum-one' = 'arbitrum-one',
  'arbitrum-sepolia' = 'arbitrum-sepolia',
  'op-mainnet' = 'op-mainnet',
  'op-sepolia' = 'op-sepolia',
}

export type PendingStandbySwap = {
  transactionHash?: string
  context: TransactionContext
  status: TransactionStatus.Pending
  feeCurrencyId?: string
} & Omit<TokenExchange, 'block' | 'fees' | 'transactionHash' | 'status'>

export type PendingStandbyTransfer = {
  transactionHash?: string
  context: TransactionContext
  status: TransactionStatus.Pending
  feeCurrencyId?: string
} & Omit<TokenTransfer, 'block' | 'fees' | 'transactionHash' | 'status'>

export type PendingStandbyApproval = {
  transactionHash?: string
  context: TransactionContext
  status: TransactionStatus.Pending
  feeCurrencyId?: string
} & Omit<TokenApproval, 'block' | 'fees' | 'transactionHash' | 'status'>

export type ConfirmedStandbyTransaction = (
  | Omit<TokenExchange, 'status'>
  | Omit<TokenTransfer, 'status'>
  | Omit<TokenApproval, 'status'>
) & {
  status: TransactionStatus.Complete | TransactionStatus.Failed
  context: TransactionContext
  feeCurrencyId?: string
}

export type StandbyTransaction =
  | PendingStandbySwap
  | PendingStandbyTransfer
  | PendingStandbyApproval
  | ConfirmedStandbyTransaction

// Context used for logging the transaction execution flow.
export interface TransactionContext {
  // Unique identifier used for tracking a transaction within logging.
  // Note that this is not the transaction hash, which is unknown when creating a new transaction.
  id: string

  // A tag provided by the caller to provide context on the purpose.
  tag?: string

  // A short contextual description of what the transaction does. (e.g. "Approve attestations")
  description?: string
}

export function newTransactionContext(tag: string, description: string) {
  return {
    id: uuidv4(),
    tag,
    description,
  }
}

export interface PageInfo {
  startCursor: string
  endCursor: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export enum TransactionStatus {
  Pending = 'Pending',
  Complete = 'Complete',
  Failed = 'Failed',
}

export type TokenTransaction = TokenTransfer | TokenExchange | NftTransfer | TokenApproval

export interface TokenAmount {
  value: BigNumber.Value
  tokenAddress?: string
  localAmount?: LocalAmount
  tokenId: string
}

export interface LocalAmount {
  value: BigNumber.Value
  currencyCode: string
  exchangeRate: string
}

export enum TokenTransactionTypeV2 {
  Exchange = 'EXCHANGE',
  Received = 'RECEIVED',
  Sent = 'SENT',
  InviteSent = 'INVITE_SENT',
  InviteReceived = 'INVITE_RECEIVED',
  NftReceived = 'NFT_RECEIVED',
  NftSent = 'NFT_SENT',
  SwapTransaction = 'SWAP_TRANSACTION',
  Approval = 'APPROVAL',
}

// Can we optional the fields `transactionHash` and `block`?
export interface TokenTransfer {
  __typename: 'TokenTransferV3'
  networkId: NetworkId
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  address: string
  amount: TokenAmount
  metadata: TokenTransferMetadata
  fees: Fee[]
  status: TransactionStatus
}

export interface TokenTransferMetadata {
  title?: string
  subtitle?: string
  image?: string
  comment?: string
}

export interface NftTransfer {
  __typename: 'NftTransferV3'
  networkId: NetworkId
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  fees?: Fee[]
  nfts?: Nft[]
  status: TransactionStatus
}

// Can we optional the fields `transactionHash` and `block`?
export interface TokenExchange {
  __typename: 'TokenExchangeV3'
  networkId: NetworkId
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  inAmount: TokenAmount
  outAmount: TokenAmount
  metadata?: TokenExchangeMetadata
  fees: Fee[]
  status: TransactionStatus
}

export interface TokenExchangeMetadata {
  title?: string
  subtitle?: string
}

export enum FeeType {
  SecurityFee = 'SECURITY_FEE',
  GatewayFee = 'GATEWAY_FEE',
  EncryptionFee = 'ONE_TIME_ENCRYPTION_FEE',
}

export interface Fee {
  type: string
  amount: TokenAmount
}

export interface TokenApproval {
  __typename: 'TokenApproval'
  networkId: NetworkId
  type: TokenTransactionTypeV2
  timestamp: number
  block: string
  transactionHash: string
  tokenId: string
  approvedAmount: string | null // null represents infinite approval
  fees: Fee[]
  status: TransactionStatus
}
