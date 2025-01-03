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
  | Omit<DepositOrWithdraw, 'status'>
  | Omit<ClaimReward, 'status'>
  | Omit<EarnDeposit, 'status'>
  | Omit<EarnSwapDeposit, 'status'>
  | Omit<EarnWithdraw, 'status'>
  | Omit<EarnClaimReward, 'status'>
) & {
  status: TransactionStatus.Complete | TransactionStatus.Failed
  context: TransactionContext
  feeCurrencyId?: string
}

export type StandbyTransaction =
  | PendingStandbyTransaction<PendingTokenExchange>
  | PendingStandbyTransaction<TokenTransfer>
  | PendingStandbyTransaction<TokenApproval>
  | PendingStandbyTransaction<NftTransfer>
  | PendingStandbyTransaction<DepositOrWithdraw>
  | PendingStandbyTransaction<ClaimReward>
  | PendingStandbyTransaction<EarnDeposit>
  | PendingStandbyTransaction<EarnSwapDeposit>
  | PendingStandbyTransaction<EarnWithdraw>
  | PendingStandbyTransaction<EarnClaimReward>
  | ConfirmedStandbyTransaction

type PendingTokenExchange =
  | (Omit<TokenExchange, 'type'> & { type: TokenTransactionTypeV2.Exchange })
  | (Omit<TokenExchange, 'type'> & { type: TokenTransactionTypeV2.SwapTransaction })
  | (Omit<TokenExchange, 'type'> & {
      type: TokenTransactionTypeV2.CrossChainSwapTransaction
      isSourceNetworkTxConfirmed?: boolean
    })

// Context used for logging the transaction execution flow.
interface TransactionContext {
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
  | DepositOrWithdraw
  | ClaimReward
  | EarnDeposit
  | EarnSwapDeposit
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

// Be sure to also update FEED_V2_INCLUDE_TYPES if you add a new type.
export enum TokenTransactionTypeV2 {
  Exchange = 'EXCHANGE',
  Received = 'RECEIVED',
  Sent = 'SENT',
  NftReceived = 'NFT_RECEIVED',
  NftSent = 'NFT_SENT',
  SwapTransaction = 'SWAP_TRANSACTION',
  CrossChainSwapTransaction = 'CROSS_CHAIN_SWAP_TRANSACTION',
  Approval = 'APPROVAL',
  Deposit = 'DEPOSIT',
  Withdraw = 'WITHDRAW',
  ClaimReward = 'CLAIM_REWARD',
  /** @deprecated Use Deposit instead */
  EarnDeposit = 'EARN_DEPOSIT',
  /** @deprecated Use Deposit instead */
  EarnSwapDeposit = 'EARN_SWAP_DEPOSIT',
  /** @deprecated Use Withdraw instead */
  EarnWithdraw = 'EARN_WITHDRAW',
  /** @deprecated Use ClaimReward instead */
  EarnClaimReward = 'EARN_CLAIM_REWARD',
}

// Because the codebase supports both the old and new feed,
// we need this list. But we can remove it once we delete the old feed.
export const FEED_V2_INCLUDE_TYPES = [
  TokenTransactionTypeV2.Received,
  TokenTransactionTypeV2.Sent,
  TokenTransactionTypeV2.NftReceived,
  TokenTransactionTypeV2.NftSent,
  TokenTransactionTypeV2.SwapTransaction,
  TokenTransactionTypeV2.CrossChainSwapTransaction,
  TokenTransactionTypeV2.Approval,
  TokenTransactionTypeV2.Deposit,
  TokenTransactionTypeV2.Withdraw,
  TokenTransactionTypeV2.ClaimReward,
]

// Can we optional the fields `transactionHash` and `block`?
export interface TokenTransfer {
  networkId: NetworkId
  type: TokenTransactionTypeV2.Sent | TokenTransactionTypeV2.Received
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
}

export interface NftTransfer {
  networkId: NetworkId
  type: TokenTransactionTypeV2.NftReceived | TokenTransactionTypeV2.NftSent
  transactionHash: string
  timestamp: number
  block: string
  fees?: Fee[]
  nfts?: Nft[]
  status: TransactionStatus
}

// Can we optional the fields `transactionHash` and `block`?
export interface TokenExchange {
  networkId: NetworkId
  type:
    | TokenTransactionTypeV2.Exchange
    | TokenTransactionTypeV2.SwapTransaction
    | TokenTransactionTypeV2.CrossChainSwapTransaction
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
  AppFee = 'APP_FEE',
  CrossChainFee = 'CROSS_CHAIN_FEE',
}

export interface Fee {
  type: string
  amount: TokenAmount
}

export interface TokenApproval {
  networkId: NetworkId
  type: TokenTransactionTypeV2.Approval
  timestamp: number
  block: string
  transactionHash: string
  tokenId: string
  approvedAmount: string | null // null represents infinite approval
  fees: Fee[]
  status: TransactionStatus
}

export interface DepositOrWithdraw {
  networkId: NetworkId
  type: TokenTransactionTypeV2.Deposit | TokenTransactionTypeV2.Withdraw
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  appName: string | undefined
  inAmount: TokenAmount
  outAmount: TokenAmount
  // If the deposit/withdraw also includes a swap, it will be provided here.
  swap?: {
    inAmount: TokenAmount
    outAmount: TokenAmount
  }
  status: TransactionStatus
}

/** @deprecated Use DepositOrWithdraw instead */
export interface EarnDeposit {
  networkId: NetworkId
  type: TokenTransactionTypeV2.EarnDeposit
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  providerId: string
  inAmount: TokenAmount
  outAmount: TokenAmount
  status: TransactionStatus
}

/** @deprecated Use DepositOrWithdraw instead */
export interface EarnSwapDeposit {
  networkId: NetworkId
  type: TokenTransactionTypeV2.EarnSwapDeposit
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  swap: {
    inAmount: TokenAmount
    outAmount: TokenAmount
  }
  deposit: {
    inAmount: TokenAmount
    outAmount: TokenAmount
    providerId: string
  }
  status: TransactionStatus
}

/** @deprecated Use DepositOrWithdraw instead */
export interface EarnWithdraw {
  networkId: NetworkId
  type: TokenTransactionTypeV2.EarnWithdraw
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  providerId: string
  inAmount: TokenAmount
  outAmount: TokenAmount
  status: TransactionStatus
}

/** @deprecated Use ClaimReward instead */
export interface EarnClaimReward {
  networkId: NetworkId
  amount: TokenAmount
  type: TokenTransactionTypeV2.EarnClaimReward
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  providerId: string
  status: TransactionStatus
}

export interface ClaimReward {
  networkId: NetworkId
  amount: TokenAmount
  type: TokenTransactionTypeV2.ClaimReward
  transactionHash: string
  timestamp: number
  block: string
  fees: Fee[]
  appName: string | undefined
  status: TransactionStatus
}

export interface TrackedTx {
  tx: TransactionRequest | undefined
  txHash: Hash | undefined
  txReceipt: TransactionReceipt | undefined
}
