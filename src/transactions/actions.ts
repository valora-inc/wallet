import { NumberToRecipient } from 'src/recipients/recipient'
import { InviteTransactions } from 'src/transactions/reducer'
import { StandbySwap, StandbyTransfer, TokenTransaction } from 'src/transactions/types'

export enum Actions {
  ADD_STANDBY_TRANSACTION = 'TRANSACTIONS/ADD_STANDBY_TRANSACTION',
  REMOVE_STANDBY_TRANSACTION = 'TRANSACTIONS/REMOVE_STANDBY_TRANSACTION',
  ADD_HASH_TO_STANDBY_TRANSACTIONS = 'TRANSACTIONS/ADD_HASH_TO_STANDBY_TRANSACTIONS',
  TRANSACTION_FAILED = 'TRANSACTIONS/TRANSACTION_FAILED',
  REFRESH_RECENT_TX_RECIPIENTS = 'TRANSACTIONS/REFRESH_RECENT_TX_RECIPIENTS',
  UPDATE_RECENT_TX_RECIPIENT_CACHE = 'TRANSACTIONS/UPDATE_RECENT_TX_RECIPIENT_CACHE',
  TRANSACTION_FEED_UPDATED = 'TRANSACTIONS/TRANSACTION_FEED_UPDATED',
  UPDATE_TRANSACTIONS = 'TRANSACTIONS/UPDATE_TRANSACTIONS',
  UPDATE_INVITE_TRANSACTIONS = 'TRANSACTIONS/UPDATE_INVITE_TRANSACTIONS',
}

type BaseStandbyTransaction =
  | Omit<StandbyTransfer, 'timestamp' | 'status'>
  | Omit<StandbySwap, 'timestamp' | 'status'>

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

export interface TransactionFailedAction {
  type: Actions.TRANSACTION_FAILED
  txId: string
}

export interface UpdatedRecentTxRecipientsCacheAction {
  type: Actions.UPDATE_RECENT_TX_RECIPIENT_CACHE
  recentTxRecipientsCache: NumberToRecipient
}

export interface TransactionFeedUpdatedAction {
  type: Actions.TRANSACTION_FEED_UPDATED
  transactions: TokenTransaction[]
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
  | TransactionFeedUpdatedAction
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

export const transactionFailed = (txId: string): TransactionFailedAction => ({
  type: Actions.TRANSACTION_FAILED,
  txId,
})

export const addHashToStandbyTransaction = (
  idx: string,
  hash: string
): AddHashToStandbyTransactionAction => ({
  type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS,
  idx,
  hash,
})

export const transactionFeedUpdated = (
  transactions: TokenTransaction[]
): TransactionFeedUpdatedAction => ({
  type: Actions.TRANSACTION_FEED_UPDATED,
  transactions,
})

export const updateInviteTransactions = (
  inviteTransactions: InviteTransactions
): UpdateInviteTransactionsAction => ({
  type: Actions.UPDATE_INVITE_TRANSACTIONS,
  inviteTransactions,
})
