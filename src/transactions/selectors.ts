import { createSelector } from 'reselect'
import { type RootState } from 'src/redux/reducers'
import { getSupportedNetworkIdsForApprovalTxsInHomefeed } from 'src/tokens/utils'
import {
  type ConfirmedStandbyTransaction,
  type NetworkId,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'

const allStandbyTransactionsSelector = (state: RootState) => state.transactions.standbyTransactions
const standbyTransactionsSelector = createSelector(
  [allStandbyTransactionsSelector, getSupportedNetworkIdsForApprovalTxsInHomefeed],
  (standbyTransactions, supportedNetworkIdsForApprovalTxs) => {
    return standbyTransactions.filter((tx) => {
      if (tx.type === TokenTransactionTypeV2.Approval) {
        return supportedNetworkIdsForApprovalTxs.includes(tx.networkId)
      }
      return true
    })
  }
)

export const formattedStandByTransactionsSelector = createSelector(
  [allStandbyTransactionsSelector],
  (transactions) => {
    return transactions.map((tx): TokenTransaction => {
      if (tx.status === TransactionStatus.Pending) {
        return {
          fees: [],
          block: '',
          transactionHash: '',
          ...tx, // in case the transaction already has the above (e.g. cross chain swaps), use the real values
        }
      }

      return tx
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

const transactionsByNetworkIdSelector = (state: RootState) =>
  state.transactions.transactionsByNetworkId

export const transactionsSelector = createSelector(
  [transactionsByNetworkIdSelector, getSupportedNetworkIdsForApprovalTxsInHomefeed],
  (transactions, supportedNetworkIdsForApprovalTxs) => {
    const transactionsForAllNetworks = Object.values(transactions).flat()
    return transactionsForAllNetworks
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((tx) => {
        if (tx.type === TokenTransactionTypeV2.Approval) {
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

const feedFirstPage = (state: RootState) => state.transactions.feedFirstPage

export const feedFirstPageSelector = createSelector(feedFirstPage, (feed) => feed)
