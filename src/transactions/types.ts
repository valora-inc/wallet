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

export type PendingStandbySwap = BaseTokenExchange & BasePendingTransactionProperties
export type PendingStandbyTransfer = BaseTokenTransfer & BasePendingTransactionProperties
export type PendingTokenApproval = BaseTokenApproval & BasePendingTransactionProperties
export type ConfirmedStandbyTransaction = (TokenExchange | TokenTransfer | TokenApproval) & {
  context: TransactionContext
  feeCurrencyId?: string
}

export type StandbyTransaction =
  | PendingStandbySwap
  | PendingStandbyTransfer
  | PendingTokenApproval
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

interface BasePendingTransactionProperties {
  networkId: NetworkId
  type: TokenTransactionTypeV2
  transactionHash?: string
  timestamp: number
  context: TransactionContext
  status: TransactionStatus.Pending
  feeCurrencyId?: string
}

interface BaseConfirmedTransactionProperties {
  networkId: NetworkId
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  status: TransactionStatus.Complete | TransactionStatus.Failed
}

interface BaseTokenTransfer {
  __typename: 'TokenTransferV3'
  address: string
  amount: TokenAmount
  metadata: TokenTransferMetadata
}
export type TokenTransfer = BaseTokenTransfer & BaseConfirmedTransactionProperties

export interface TokenTransferMetadata {
  title?: string
  subtitle?: string
  image?: string
  comment?: string
}

interface BaseNftTransfer {
  __typename: 'NftTransferV3'
  nfts?: Nft[]
}
export type NftTransfer = BaseNftTransfer & BaseConfirmedTransactionProperties

interface BaseTokenExchange {
  __typename: 'TokenExchangeV3'
  inAmount: TokenAmount
  outAmount: TokenAmount
  metadata?: TokenExchangeMetadata
}

export type TokenExchange = BaseTokenExchange & BaseConfirmedTransactionProperties

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

interface BaseTokenApproval {
  __typename: 'TokenApproval'
  tokenId: string
  approvedAmount: string | null // null represents infinite approval
}

export type TokenApproval = BaseConfirmedTransactionProperties & BaseTokenApproval
