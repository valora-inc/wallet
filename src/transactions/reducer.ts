import { createSelector } from 'reselect'
import { ActionTypes as ExchangeActionTypes } from 'src/exchange/actions'
import { NumberToRecipient } from 'src/recipients/recipient'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { getSupportedNetworkIdsForApprovalTxsInHomefeed } from 'src/tokens/utils'
import { Actions, ActionTypes } from 'src/transactions/actions'
import {
  ConfirmedStandbyTransaction,
  NetworkId,
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

type TransactionsByNetworkId = {
  [networkId in NetworkId]?: TokenTransaction[]
}
interface State {
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
  transactionsByNetworkId: TransactionsByNetworkId
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
  transactionsByNetworkId: {},
  inviteTransactions: {},
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | ExchangeActionTypes
): State => {
  switch (action.type) {
    case REHYDRATE: {
      const persistedState: State = getRehydratePayload(action, 'transactions')
      return {
        ...state,
        ...persistedState,
        standbyTransactions: (persistedState.standbyTransactions || []).filter(
          (tx) => tx.transactionHash
        ),
      }
    }
    case Actions.ADD_STANDBY_TRANSACTION:
      // Removing any duplicate transactions
      const otherStandbyTransactions = (state.standbyTransactions || []).filter(
        (tx) =>
          !(
            tx.context.id === action.transaction.context.id ||
            (action.transaction.transactionHash &&
              tx.transactionHash === action.transaction.transactionHash)
          )
      )

      return {
        ...state,
        standbyTransactions: [
          {
            ...action.transaction,
            timestamp: Date.now(),
            status: TransactionStatus.Pending,
          },
          ...otherStandbyTransactions,
        ],
      }
    case Actions.REMOVE_STANDBY_TRANSACTION:
      return {
        ...state,
        standbyTransactions: state.standbyTransactions.filter(
          (tx: StandbyTransaction) => tx.context.id !== action.idx
        ),
      }
    case Actions.TRANSACTION_CONFIRMED: {
      const { status, transactionHash, block, fees } = action.receipt

      return {
        ...state,
        standbyTransactions: state.standbyTransactions.map(
          (standbyTransaction): StandbyTransaction => {
            if (standbyTransaction.context.id === action.txId) {
              return {
                ...standbyTransaction,
                status: status,
                transactionHash,
                block,
                timestamp: action.blockTimestampInMs,
                fees: fees || [],
              }
            }
            return standbyTransaction
          }
        ),
      }
    }
    case Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS:
      return {
        ...state,
        standbyTransactions: state.standbyTransactions.map(
          (standbyTransaction): StandbyTransaction => {
            if (standbyTransaction.context.id === action.idx) {
              return { ...standbyTransaction, transactionHash: action.hash }
            }
            return standbyTransaction
          }
        ),
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
        transactionsByNetworkId: {
          ...state.transactionsByNetworkId,
          [action.networkId]: action.transactions,
        },
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

const allStandbyTransactionsSelector = (state: RootState) => state.transactions.standbyTransactions
export const standbyTransactionsSelector = createSelector(
  [allStandbyTransactionsSelector, getSupportedNetworkIdsForApprovalTxsInHomefeed],
  (standbyTransactions, supportedNetworkIdsForApprovalTxs) => {
    return standbyTransactions.filter((tx) => {
      if (tx.__typename === 'TokenApproval') {
        return supportedNetworkIdsForApprovalTxs.includes(tx.networkId)
      }
      return true
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

export const confirmedStandbyTransactionsSelector = createSelector(
  [standbyTransactionsSelector],
  (transactions) => {
    return transactions.filter(
      (transaction): transaction is ConfirmedStandbyTransaction =>
        transaction.status === TransactionStatus.Complete ||
        transaction.status === TransactionStatus.Failed
    )
  }
)

export const knownFeedTransactionsSelector = (state: RootState) =>
  state.transactions.knownFeedTransactions

export const recentTxRecipientsCacheSelector = (state: RootState) =>
  state.transactions.recentTxRecipientsCache

export const transactionsByNetworkIdSelector = (state: RootState) =>
  state.transactions.transactionsByNetworkId

export const transactionsSelector = createSelector(
  [transactionsByNetworkIdSelector],
  (transactions) => {
    const transactionsForAllNetworks = Object.values(transactions).flat()
    return transactionsForAllNetworks.sort((a, b) => b.timestamp - a.timestamp)
  }
)

export const inviteTransactionsSelector = (state: RootState) =>
  state.transactions.inviteTransactions

export const transactionHashesByNetworkIdSelector = createSelector(
  [transactionsByNetworkIdSelector],
  (transactions) => {
    const hashesByNetwork: {
      [networkId in NetworkId]?: Set<string>
    } = {}
    Object.entries(transactions).forEach(([networkId, txs]) => {
      hashesByNetwork[networkId as NetworkId] = new Set(txs.map((tx) => tx.transactionHash))
    })

    return hashesByNetwork
  }
)
