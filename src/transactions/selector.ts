import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'
import { ConfirmedStandbyTransaction, NetworkId, TransactionStatus } from 'src/transactions/types'

export const standbyTransactionsSelector = (state: RootState) =>
  state.transactions.standbyTransactions

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
