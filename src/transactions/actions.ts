import { NumberToRecipient } from 'src/recipients/recipient'
import { InviteTransactions } from 'src/transactions/reducer'
import {
  Fee,
  NetworkId,
  PendingStandbyApproval,
  PendingStandbyNFTTransfer,
  PendingStandbySwap,
  PendingStandbyTransfer,
  TokenTransaction,
  TransactionStatus,
} from 'src/transactions/types'

export enum Actions {
  ADD_STANDBY_TRANSACTION = 'TRANSACTIONS/ADD_STANDBY_TRANSACTION',
  REMOVE_STANDBY_TRANSACTION = 'TRANSACTIONS/REMOVE_STANDBY_TRANSACTION',
  ADD_HASH_TO_STANDBY_TRANSACTIONS = 'TRANSACTIONS/ADD_HASH_TO_STANDBY_TRANSACTIONS',
  TRANSACTION_CONFIRMED = 'TRANSACTIONS/TRANSACTION_CONFIRMED',
  REFRESH_RECENT_TX_RECIPIENTS = 'TRANSACTIONS/REFRESH_RECENT_TX_RECIPIENTS',
  UPDATE_RECENT_TX_RECIPIENT_CACHE = 'TRANSACTIONS/UPDATE_RECENT_TX_RECIPIENT_CACHE',
  UPDATE_TRANSACTIONS = 'TRANSACTIONS/UPDATE_TRANSACTIONS',
  UPDATE_INVITE_TRANSACTIONS = 'TRANSACTIONS/UPDATE_INVITE_TRANSACTIONS',
}

export type BaseStandbyTransaction =
  | Omit<PendingStandbyTransfer, 'timestamp' | 'status'>
  | Omit<PendingStandbySwap, 'timestamp' | 'status'>
  | Omit<PendingStandbyApproval, 'timestamp' | 'status'>
  | Omit<PendingStandbyNFTTransfer, 'timestamp' | 'status'>

export interface AddStandbyTransactionAction {
  type: Actions.ADD_STANDBY_TRANSACTION
  transaction: BaseStandbyTransaction
}

export interface RemoveStandbyTransactionAction {
  type: Actions.REMOVE_STANDBY_TRANSACTION
  idx: string
}

export interface AddHashToStandbyTransactionAction {
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS
  idx: string
  hash: string
}

// this type would ideally be TransactionReceipt from viem however the numbers
// are of type bigint which is not serializable and causes problems at runtime
export type BaseTransactionReceipt = {
  status: TransactionStatus
  block: string
  transactionHash: string
  fees?: Fee[]
}
export interface TransactionConfirmedAction {
  type: Actions.TRANSACTION_CONFIRMED
  txId: string
  receipt: BaseTransactionReceipt
  blockTimestampInMs: number
}

export interface UpdatedRecentTxRecipientsCacheAction {
  type: Actions.UPDATE_RECENT_TX_RECIPIENT_CACHE
  recentTxRecipientsCache: NumberToRecipient
}

export interface UpdateTransactionsAction {
  type: Actions.UPDATE_TRANSACTIONS
  transactions: TokenTransaction[]
  networkId: NetworkId
}

export interface UpdateInviteTransactionsAction {
  type: Actions.UPDATE_INVITE_TRANSACTIONS
  inviteTransactions: InviteTransactions
}

export type ActionTypes =
  | AddStandbyTransactionAction
  | RemoveStandbyTransactionAction
  | AddHashToStandbyTransactionAction
  | UpdatedRecentTxRecipientsCacheAction
  | UpdateTransactionsAction
  | TransactionConfirmedAction
  | UpdateInviteTransactionsAction

export const addStandbyTransaction = (
  transaction: BaseStandbyTransaction
): AddStandbyTransactionAction => ({
  type: Actions.ADD_STANDBY_TRANSACTION,
  transaction,
})

export const removeStandbyTransaction = (idx: string): RemoveStandbyTransactionAction => ({
  type: Actions.REMOVE_STANDBY_TRANSACTION,
  idx,
})

export const updateRecentTxRecipientsCache = (
  recentTxRecipientsCache: NumberToRecipient
): UpdatedRecentTxRecipientsCacheAction => ({
  type: Actions.UPDATE_RECENT_TX_RECIPIENT_CACHE,
  recentTxRecipientsCache,
})

export const transactionConfirmed = (
  txId: string,
  receipt: BaseTransactionReceipt,
  blockTimestampInMs: number
): TransactionConfirmedAction => ({
  type: Actions.TRANSACTION_CONFIRMED,
  txId,
  receipt,
  blockTimestampInMs,
})

export const addHashToStandbyTransaction = (
  idx: string,
  hash: string
): AddHashToStandbyTransactionAction => ({
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS,
  idx,
  hash,
})

export const updateTransactions = (
  networkId: NetworkId,
  transactions: TokenTransaction[]
): UpdateTransactionsAction => ({
  type: Actions.UPDATE_TRANSACTIONS,
  networkId,
  transactions,
})

export const updateInviteTransactions = (
  inviteTransactions: InviteTransactions
): UpdateInviteTransactionsAction => ({
  type: Actions.UPDATE_INVITE_TRANSACTIONS,
  inviteTransactions,
})
