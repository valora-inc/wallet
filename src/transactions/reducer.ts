import { createSelector } from 'reselect'
import { ActionTypes as ExchangeActionTypes } from 'src/exchange/actions'
import { NumberToRecipient } from 'src/recipients/recipient'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Actions, ActionTypes } from 'src/transactions/actions'
import {
  CompletedStandbyTransaction,
  FailedStandbyTransaction,
  StandbyTransaction,
  TokenTransaction,
  TransactionStatus,
} from 'src/transactions/types'

export interface InviteTransactions {
  [txHash: string]: {
    paymentId: string
    recipientIdentifier: string
  }
}
export interface State {
  // Tracks transactions that have been initiated by the user
  // before they are picked up by the chain explorer and
  // included in the tx feed. Necessary so it shows up in the
  // feed instantly.
  standbyTransactions: StandbyTransaction[]
  // Tracks which set of transactions retrieved in the
  // feed have already been processed by the
  // tx feed query watcher. Necessary so we don't re-process
  // txs more than once.
  knownFeedTransactions: KnownFeedTransactionsType
  recentTxRecipientsCache: NumberToRecipient
  transactions: TokenTransaction[]
  // invite transactions are from the escrow contract, the following property maps
  // transaction hash to recipient known to user
  inviteTransactions: InviteTransactions
}

export interface KnownFeedTransactionsType {
  // Value will be an address string for transfer transactions
  // and true boolean for exchange transactions
  [txHash: string]: string | boolean
}

const initialState = {
  standbyTransactions: [],
  knownFeedTransactions: {},
  recentTxRecipientsCache: {},
  transactions: [],
  inviteTransactions: {},
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | ExchangeActionTypes
): State => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        ...state,
        ...getRehydratePayload(action, 'transactions'),
      }
    }
    case Actions.ADD_STANDBY_TRANSACTION:
      return {
        ...state,
        standbyTransactions: [
          {
            ...action.transaction,
            timestamp: Date.now(),
            status: TransactionStatus.Pending,
          },
          ...(state.standbyTransactions || []),
        ],
      }
    case Actions.REMOVE_STANDBY_TRANSACTION:
      return {
        ...state,
        standbyTransactions: state.standbyTransactions.filter(
          (tx: StandbyTransaction) => tx.context.id !== action.idx
        ),
      }
    case Actions.TRANSACTION_FAILED:
      const { txId } = action

      return {
        ...state,
        standbyTransactions: state.standbyTransactions.map(
          (standbyTransaction): StandbyTransaction => {
            if (standbyTransaction.context.id === txId) {
              return {
                ...standbyTransaction,
                status: TransactionStatus.Failed,
              }
            }
            return standbyTransaction
          }
        ),
      }

    case Actions.TRANSACTION_CONFIRMED: {
      const { status, transactionHash, block } = action.receipt
      if (!status) {
        return {
          ...state,
        }
      }

      return {
        ...state,
        standbyTransactions: state.standbyTransactions.map(
          (standbyTransaction): StandbyTransaction => {
            if (standbyTransaction.context.id === action.txId) {
              return {
                ...standbyTransaction,
                status: TransactionStatus.Complete,
                transactionHash,
                block,
                timestamp: Date.now(),
                fees: [],
              }
            }
            return standbyTransaction
          }
        ),
      }
    }
    case Actions.UPDATE_RECENT_TX_RECIPIENT_CACHE:
      return {
        ...state,
        recentTxRecipientsCache: action.recentTxRecipientsCache,
      }
    case Actions.UPDATE_TRANSACTIONS:
      const newKnownFeedTransactions = { ...state.knownFeedTransactions }
      action.transactions.forEach((tx) => {
        if ('address' in tx) {
          newKnownFeedTransactions[tx.transactionHash] = tx.address
        }
      })

      return {
        ...state,
        transactions: action.transactions,
        knownFeedTransactions: newKnownFeedTransactions,
      }
    case Actions.UPDATE_INVITE_TRANSACTIONS:
      return {
        ...state,
        inviteTransactions: action.inviteTransactions,
      }
    default:
      return state
  }
}

export const standbyTransactionsSelector = (state: RootState) =>
  state.transactions.standbyTransactions

export const watchablePendingTransactionSelector = createSelector(
  [standbyTransactionsSelector],
  (transactions) => {
    return transactions.filter((transaction) => {
      return transaction.status === TransactionStatus.Pending && transaction.transactionHash
    })
  }
)

export const pendingStandbyTransactionsSelector = createSelector(
  [standbyTransactionsSelector],
  (transactions) => {
    return transactions
      .filter((transaction) => transaction.status === TransactionStatus.Pending)
      .map((transaction) => ({
        ...transaction,
        transactionHash: transaction.transactionHash || '',
        block: '',
        fees: [],
      }))
  }
)

export const failedStandbyTransactionsSelector = createSelector(
  [standbyTransactionsSelector],
  (transactions) => {
    return transactions
      .filter(
        (transaction): transaction is FailedStandbyTransaction =>
          transaction.status === TransactionStatus.Failed
      )
      .map((transaction) => ({
        ...transaction,
        transactionHash: transaction.transactionHash || '',
        block: '',
        fees: [],
      }))
  }
)

export const completedStandbyTransactionsSelector = createSelector(
  [standbyTransactionsSelector],
  (transactions) => {
    return transactions.filter(
      (transaction): transaction is CompletedStandbyTransaction =>
        transaction.status === TransactionStatus.Complete
    )
  }
)

export const knownFeedTransactionsSelector = (state: RootState) =>
  state.transactions.knownFeedTransactions

export const recentTxRecipientsCacheSelector = (state: RootState) =>
  state.transactions.recentTxRecipientsCache

export const transactionsSelector = (state: RootState) => state.transactions.transactions

export const inviteTransactionsSelector = (state: RootState) =>
  state.transactions.inviteTransactions

export const transactionHashesSelector = (state: RootState) =>
  state.transactions.transactions.map((tx) => tx.transactionHash)
