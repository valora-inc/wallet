import { createSelector } from 'reselect'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { getSupportedNetworkIdsForApprovalTxsInHomefeed } from 'src/tokens/utils'
import { Actions, ActionTypes } from 'src/transactions/actions'
import {
  ConfirmedStandbyTransaction,
  NetworkId,
  StandbyTransaction,
  TokenExchange,
  TokenTransaction,
  TransactionStatus,
} from 'src/transactions/types'

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
  transactionsByNetworkId: TransactionsByNetworkId
}

export interface KnownFeedTransactionsType {
  // Value will be an address string for transfer transactions
  // and true boolean for exchange transactions
  [txHash: string]: string | boolean
}

const initialState = {
  standbyTransactions: [],
  knownFeedTransactions: {},
  transactionsByNetworkId: {},
}
// export for testing
export const _initialState = initialState

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
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
                ...(standbyTransaction.__typename === 'CrossChainTokenExchange' && {
                  isSourceNetworkTxConfirmed: true,
                }),
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
    case Actions.UPDATE_TRANSACTIONS:
      const newKnownFeedTransactions = { ...state.knownFeedTransactions }
      action.transactions.forEach((tx) => {
        if ('address' in tx) {
          newKnownFeedTransactions[tx.transactionHash] = tx.address
        }
      })

      const standbyTransactionHashes = new Set(
        state.standbyTransactions
          .map((tx) => tx.transactionHash)
          .filter((hash) => hash !== undefined)
      )

      // Separate pending cross-chain swap transactions from other received
      // transactions for custom processing. Usually transactions received from
      // blockchain-api should overwrite standby transaction but for pending
      // cross chain swaps, we want to augment the existing standby transaction
      // with the received transaction information. This is because the standby
      // transaction contains information about the intended inAmount value
      // which blockchain-api does not have access to whilst the transaction is
      // pending.
      const receivedTransactions: TokenTransaction[] = []
      const pendingCrossChainTxsWithStandby: TokenExchange[] = []
      action.transactions.forEach((tx) => {
        if (
          tx.status === TransactionStatus.Pending &&
          tx.__typename === 'CrossChainTokenExchange' &&
          standbyTransactionHashes.has(tx.transactionHash)
        ) {
          pendingCrossChainTxsWithStandby.push(tx)
        } else {
          receivedTransactions.push(tx)
        }
      })

      const receivedTxHashes = new Set(receivedTransactions.map((tx) => tx.transactionHash))
      const updatedStandbyTransactions = state.standbyTransactions
        .filter(
          // remove standby transactions that match non cross-chain swap transactions from blockchain-api
          (standbyTx) =>
            !standbyTx.transactionHash ||
            standbyTx.networkId !== action.networkId ||
            !receivedTxHashes.has(standbyTx.transactionHash)
        )
        .map((standbyTx) => {
          // augment existing standby cross chain swap transactions with
          // received tx information from blockchain-api, but keep the estimated
          // inAmount value from the original standby transaction
          if (standbyTx.transactionHash && standbyTx.__typename === 'CrossChainTokenExchange') {
            const receivedCrossChainTx = pendingCrossChainTxsWithStandby.find(
              (tx) => tx.transactionHash === standbyTx.transactionHash
            )
            if (receivedCrossChainTx) {
              return {
                ...standbyTx,
                ...receivedCrossChainTx,
                inAmount: {
                  ...receivedCrossChainTx.inAmount,
                  value: standbyTx.inAmount.value,
                },
              }
            }
          }

          return standbyTx
        })

      return {
        ...state,
        transactionsByNetworkId: {
          ...state.transactionsByNetworkId,
          [action.networkId]: receivedTransactions,
        },
        knownFeedTransactions: newKnownFeedTransactions,
        standbyTransactions: updatedStandbyTransactions,
      }
    default:
      return state
  }
}

const allStandbyTransactionsSelector = (state: RootState) => state.transactions.standbyTransactions
const standbyTransactionsSelector = createSelector(
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
        transactionHash: transaction.transactionHash || '',
        block: '',
        fees: [],
        ...transaction, // in case the transaction already has the above (e.g. cross chain swaps), use the real values
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

export const transactionsByNetworkIdSelector = (state: RootState) =>
  state.transactions.transactionsByNetworkId

export const transactionsSelector = createSelector(
  [transactionsByNetworkIdSelector, getSupportedNetworkIdsForApprovalTxsInHomefeed],
  (transactions, supportedNetworkIdsForApprovalTxs) => {
    const transactionsForAllNetworks = Object.values(transactions).flat()
    return transactionsForAllNetworks
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((tx) => {
        if (tx.__typename === 'TokenApproval') {
          return supportedNetworkIdsForApprovalTxs.includes(tx.networkId)
        }
        return true
      })
  }
)

export const pendingTxHashesByNetworkIdSelector = createSelector(
  [transactionsByNetworkIdSelector],
  (transactions) => {
    const hashesByNetwork: {
      [networkId in NetworkId]?: Set<string>
    } = {}
    Object.entries(transactions).forEach(([networkId, txs]) => {
      hashesByNetwork[networkId as NetworkId] = new Set(
        txs.filter((tx) => tx.status === TransactionStatus.Pending).map((tx) => tx.transactionHash)
      )
    })

    return hashesByNetwork
  }
)

export const completedTxHashesByNetworkIdSelector = createSelector(
  [transactionsByNetworkIdSelector],
  (transactions) => {
    const hashesByNetwork: {
      [networkId in NetworkId]?: Set<string>
    } = {}
    Object.entries(transactions).forEach(([networkId, txs]) => {
      hashesByNetwork[networkId as NetworkId] = new Set(
        txs.filter((tx) => tx.status === TransactionStatus.Complete).map((tx) => tx.transactionHash)
      )
    })

    return hashesByNetwork
  }
)

export const pendingStandbyTxHashesByNetworkIdSelector = createSelector(
  [standbyTransactionsSelector],
  (transactions) => {
    const hashesByNetwork: {
      [networkId in NetworkId]?: Set<string>
    } = {}
    for (const tx of transactions) {
      if (!hashesByNetwork[tx.networkId]) {
        hashesByNetwork[tx.networkId] = new Set()
      }

      if (tx.transactionHash) {
        hashesByNetwork[tx.networkId]!.add(tx.transactionHash)
      }
    }

    return hashesByNetwork
  }
)
