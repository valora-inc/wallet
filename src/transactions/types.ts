import { Address } from '@celo/base'
import BigNumber from 'bignumber.js'
import { Nft } from 'src/nfts/types'
import { v4 as uuidv4 } from 'uuid'

export enum Network {
  Celo = 'celo',
  Ethereum = 'ethereum',
}

export enum NetworkId {
  'celo-mainnet' = 'celo-mainnet',
  'celo-alfajores' = 'celo-alfajores',
  'ethereum-mainnet' = 'ethereum-mainnet',
  'ethereum-sepolia' = 'ethereum-sepolia',
}

export interface StandbyTransaction {
  context: TransactionContext
  networkId: NetworkId
  type: TokenTransferTypeV2
  status: TransactionStatus
  value: string
  tokenId: string
  tokenAddress?: string
  comment: string
  timestamp: number
  address: Address
  hash?: string
}

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

export type TokenTransaction = TokenTransfer | TokenExchange | NftTransfer

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

type TokenTransferTypeV2 =
  | TokenTransactionTypeV2.Sent
  | TokenTransactionTypeV2.Received
  | TokenTransactionTypeV2.InviteSent
  | TokenTransactionTypeV2.InviteReceived

export enum TokenTransactionTypeV2 {
  Exchange = 'EXCHANGE',
  Received = 'RECEIVED',
  Sent = 'SENT',
  InviteSent = 'INVITE_SENT',
  InviteReceived = 'INVITE_RECEIVED',
  NftReceived = 'NFT_RECEIVED',
  NftSent = 'NFT_SENT',
  SwapTransaction = 'SWAP_TRANSACTION',
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
