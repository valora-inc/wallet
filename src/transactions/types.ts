import { Address } from '@celo/base'
import BigNumber from 'bignumber.js'
import { TokenTransactionType } from 'src/apollo/types'
import { Currency } from 'src/utils/currencies'
import { v4 as uuidv4 } from 'uuid'

export interface ExchangeStandbyLegacy {
  context: TransactionContext
  type: TokenTransactionType.Exchange
  status: TransactionStatus
  inValue: string
  inCurrency: Currency
  outValue: string
  outCurrency: Currency
  timestamp: number
  hash?: string
}

export interface TransferStandbyLegacy {
  context: TransactionContext
  type: TransferTransactionType
  status: TransactionStatus
  value: string
  currency: Currency
  comment: string
  timestamp: number
  address: Address
  hash?: string
}

export type StandbyTransactionLegacy = ExchangeStandbyLegacy | TransferStandbyLegacy

export interface ExchangeStandby {
  context: TransactionContext
  type: TokenTransactionTypeV2.Exchange
  status: TransactionStatus
  inValue: string
  inTokenAddress: string
  outValue: string
  outTokenAddress: string
  timestamp: number
  hash?: string
}

export interface TransferStandby {
  context: TransactionContext
  type: TokenTransferTypeV2
  status: TransactionStatus
  value: string
  tokenAddress: string
  comment: string
  timestamp: number
  address: Address
  hash?: string
}

export type StandbyTransaction = ExchangeStandby | TransferStandby

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

type TransferTransactionType =
  | TokenTransactionType.Sent
  | TokenTransactionType.Received
  | TokenTransactionType.EscrowReceived
  | TokenTransactionType.EscrowSent
  | TokenTransactionType.Faucet
  | TokenTransactionType.VerificationReward
  | TokenTransactionType.VerificationFee
  | TokenTransactionType.InviteSent
  | TokenTransactionType.InviteReceived
  | TokenTransactionType.NetworkFee

export type TokenTransaction = TokenTransfer | TokenExchange

export interface TokenAmount {
  value: BigNumber.Value
  tokenAddress: string
  localAmount?: LocalAmount
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
}

// Can we optional the fields `transactionHash` and `block`?
export interface TokenTransfer {
  __typename: 'TokenTransferV2'
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

// Can we optional the fields `transactionHash` and `block`?
export interface TokenExchange {
  __typename: 'TokenExchangeV2'
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  inAmount: TokenAmount
  outAmount: TokenAmount
  metadata: TokenExchangeMetadata
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
