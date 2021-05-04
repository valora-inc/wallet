import { Address } from '@celo/base'
import { TokenTransactionType } from 'src/apollo/types'
import { Currency } from 'src/utils/currencies'
import { v4 as uuidv4 } from 'uuid'

export interface ExchangeStandby {
  context: TransactionContext
  type: TokenTransactionType.Exchange
  status: TransactionStatus
  inSymbol: Currency
  inValue: string
  outSymbol: Currency
  outValue: string
  timestamp: number
  hash?: string
}

export interface TransferStandby {
  context: TransactionContext
  type: TransferTransactionType
  status: TransactionStatus
  value: string
  comment: string
  symbol: Currency
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
