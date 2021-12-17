import { Address } from '@celo/base'
import BigNumber from 'bignumber.js'
import { TokenTransactionType } from 'src/apollo/types'
import { Currency } from 'src/utils/currencies'
import { v4 as uuidv4 } from 'uuid'

export interface ExchangeStandby {
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

export interface TransferStandby {
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

export enum TokenTransactionTypeV2 {
  Exchange = 'EXCHANGE',
  Received = 'RECEIVED',
  Sent = 'SENT',
  InviteSent = 'INVITE_SENT',
  InviteReceived = 'INVITE_RECEIVED',
  PaymentRequest = 'PAY_REQUEST',
}
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

export interface TokenExchange {
  __typename: 'TokenExchangeV2'
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: number
  inAmount: TokenAmount
  outAmount: TokenAmount
  metadata: TokenExchangeMetadata
  fees: [Fee]
}

interface TokenExchangeMetadata {
  title?: string
  subtitle?: string
}

export interface Fee {
  type: string
  amount: TokenAmount
}
