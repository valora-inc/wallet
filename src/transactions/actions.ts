import {
  EarnClaimReward,
  EarnDeposit,
  EarnSwapDeposit,
  EarnWithdraw,
  Fee,
  NetworkId,
  NftTransfer,
  PendingStandbyTransaction,
  TokenApproval,
  TokenExchange,
  TokenTransaction,
  TokenTransfer,
  TransactionStatus,
} from 'src/transactions/types'

export enum Actions {
  ADD_STANDBY_TRANSACTION = 'TRANSACTIONS/ADD_STANDBY_TRANSACTION',
  TRANSACTION_CONFIRMED = 'TRANSACTIONS/TRANSACTION_CONFIRMED',
  REFRESH_RECENT_TX_RECIPIENTS = 'TRANSACTIONS/REFRESH_RECENT_TX_RECIPIENTS',
  UPDATE_TRANSACTIONS = 'TRANSACTIONS/UPDATE_TRANSACTIONS',
  REMOVE_STANDBY_TRANSACTIONS = 'TRANSACTIONS/REMOVE_STANDBY_TRANSACTIONS',
}

type BaseStandbyTransactionType<T> = Omit<PendingStandbyTransaction<T>, 'timestamp' | 'status'>

export type BaseStandbyTransaction =
  | BaseStandbyTransactionType<TokenTransfer>
  | BaseStandbyTransactionType<TokenExchange>
  | BaseStandbyTransactionType<TokenApproval>
  | BaseStandbyTransactionType<NftTransfer>
  | BaseStandbyTransactionType<EarnDeposit>
  | BaseStandbyTransactionType<EarnSwapDeposit>
  | BaseStandbyTransactionType<EarnWithdraw>
  | BaseStandbyTransactionType<EarnClaimReward>

export interface AddStandbyTransactionAction {
  type: Actions.ADD_STANDBY_TRANSACTION
  transaction: BaseStandbyTransaction
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

export interface UpdateTransactionsAction {
  type: Actions.UPDATE_TRANSACTIONS
  transactions: TokenTransaction[]
  networkId: NetworkId
}

interface RemoveStandByTransactionsAction {
  type: Actions.REMOVE_STANDBY_TRANSACTIONS
  transactionHashesToRemove: string[]
}

export type ActionTypes =
  | AddStandbyTransactionAction
  | UpdateTransactionsAction
  | TransactionConfirmedAction
  | RemoveStandByTransactionsAction

export const addStandbyTransaction = (
  transaction: BaseStandbyTransaction
): AddStandbyTransactionAction => ({
  type: Actions.ADD_STANDBY_TRANSACTION,
  transaction,
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

export const updateTransactions = (
  networkId: NetworkId,
  transactions: TokenTransaction[]
): UpdateTransactionsAction => ({
  type: Actions.UPDATE_TRANSACTIONS,
  networkId,
  transactions,
})

export const removeStandByTransactions = (
  transactionHashesToRemove: string[]
): RemoveStandByTransactionsAction => ({
  type: Actions.REMOVE_STANDBY_TRANSACTIONS,
  transactionHashesToRemove,
})
