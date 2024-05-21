import BigNumber from 'bignumber.js'
import { Nft } from 'src/nfts/types'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import { v4 as uuidv4 } from 'uuid'
import { Hash, TransactionReceipt } from 'viem'

export enum Network {
  Celo = 'celo',
  Ethereum = 'ethereum',
  Arbitrum = 'arbitrum',
  Optimism = 'optimism',
  PolygonPoS = 'polygon-pos',
  Base = 'base',
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
  'polygon-pos-mainnet' = 'polygon-pos-mainnet',
  'polygon-pos-amoy' = 'polygon-pos-amoy',
  'base-mainnet' = 'base-mainnet',
  'base-sepolia' = 'base-sepolia',
}

export type PendingStandbyTransaction<T> = {
  transactionHash?: string
  context: TransactionContext
  status: TransactionStatus.Pending
  feeCurrencyId?: string
} & Omit<T, 'block' | 'fees' | 'transactionHash' | 'status'>

export type ConfirmedStandbyTransaction = (
  | Omit<TokenExchange, 'status'>
  | Omit<TokenTransfer, 'status'>
  | Omit<TokenApproval, 'status'>
  | Omit<NftTransfer, 'status'>
  | Omit<EarnDeposit, 'status'>
  | Omit<EarnWithdraw, 'status'>
  | Omit<EarnClaimReward, 'status'>
) & {
  status: TransactionStatus.Complete | TransactionStatus.Failed
  context: TransactionContext
  feeCurrencyId?: string
}

export type StandbyTransaction =
  | PendingStandbyTransaction<TokenExchange>
  | PendingStandbyTransaction<TokenTransfer>
  | PendingStandbyTransaction<TokenApproval>
  | PendingStandbyTransaction<NftTransfer>
  | PendingStandbyTransaction<EarnDeposit>
  | PendingStandbyTransaction<EarnWithdraw>
  | PendingStandbyTransaction<EarnClaimReward>
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

export type TokenTransaction =
  | TokenTransfer
  | TokenExchange
  | NftTransfer
  | TokenApproval
  | EarnDeposit
  | EarnWithdraw
  | EarnClaimReward

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
  EarnDeposit = 'EARN_DEPOSIT',
  EarnWithdraw = 'EARN_WITHDRAW',
  EarnClaimReward = 'EARN_CLAIM_REWARD',
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

export interface EarnDeposit {
  __typename: 'EarnDeposit'
  networkId: NetworkId
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  providerId: string
  inAmount: TokenAmount
  outAmount: TokenAmount
  status: TransactionStatus
}

export interface EarnWithdraw {
  __typename: 'EarnWithdraw'
  networkId: NetworkId
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  providerId: string
  inAmount: TokenAmount
  outAmount: TokenAmount
  status: TransactionStatus
}

export interface EarnClaimReward {
  __typename: 'EarnClaimReward'
  networkId: NetworkId
  amount: TokenAmount
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  providerId: string
  status: TransactionStatus
}

export interface TrackedTx {
  tx: TransactionRequest | undefined
  txHash: Hash | undefined
  txReceipt: TransactionReceipt | undefined
}
