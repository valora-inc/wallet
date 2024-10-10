import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import GetStarted from 'src/home/GetStarted'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import { getSupportedNetworkIdsForApprovalTxsInHomefeed } from 'src/tokens/utils'
import NoActivity from 'src/transactions/NoActivity'
import { useTransactionFeedV2Query } from 'src/transactions/api'
import EarnFeedItem from 'src/transactions/feed/EarnFeedItem'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import TokenApprovalFeedItem from 'src/transactions/feed/TokenApprovalFeedItem'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import { allStandbyTransactionsSelector } from 'src/transactions/reducer'
import {
  TokenTransactionTypeV2,
  TransactionStatus,
  type NetworkId,
  type NftTransfer,
  type TokenApproval,
  type TokenEarn,
  type TokenExchange,
  type TokenTransaction,
  type TokenTransfer,
} from 'src/transactions/types'
import {
  groupFeedItemsInSections,
  standByTransactionToTokenTransaction,
} from 'src/transactions/utils'
import { walletAddressSelector } from 'src/web3/selectors'

type PaginatedData = {
  [timestamp: number]: TokenTransaction[]
}

// Query poll interval
const POLL_INTERVAL_MS = 10000 // 10 sec
const FIRST_PAGE_TIMESTAMP = 0

function getAllowedNetworksForTransfers() {
  return getMultichainFeatures().showTransfers
}

/**
 * Join allowed networks into a string to help react memoization.
 * N.B: This fetch-time filtering does not suffice to prevent non-Celo TXs from appearing
 * on the home feed, since they get cached in Redux -- this is just a network optimization.
 */
function useAllowedNetworksForTransfers() {
  const allowedNetworks = getAllowedNetworksForTransfers().join(',')
  return useMemo(() => allowedNetworks.split(',') as NetworkId[], [allowedNetworks])
}

/**
 * Join supported networks for approval into a string to help react memoization.
 * N.B: This fetch-time filtering does not suffice to prevent non-Celo TXs from appearing
 * on the home feed, since they get cached in Redux -- this is just a network optimization.
 */
function useSupportedNetworksForApproval() {
  const supportedNetworks = getSupportedNetworkIdsForApprovalTxsInHomefeed().join(',')
  return useMemo(() => supportedNetworks.split(',') as NetworkId[], [supportedNetworks])
}

/**
 * This function uses the same deduplication approach as "deduplicateTransactions" function from
 * queryHelper but only for a single flattened array instead of two.
 * Also, the queryHelper is going to be removed once we fully migrate to TransactionFeedV2,
 * so this function would have needed to be moved from queryHelper anyway.
 */
function deduplicateTransactions(transactions: TokenTransaction[]): TokenTransaction[] {
  const transactionMap: { [txHash: string]: TokenTransaction } = {}

  for (const tx of transactions) {
    transactionMap[tx.transactionHash] = tx
  }

  return Object.values(transactionMap)
}

/**
 * If the timestamps are the same, most likely one of the transactions is an approval.
 * On the feed we want to show the approval first.
 */
function sortTransactions(transactions: TokenTransaction[]): TokenTransaction[] {
  return transactions.sort((a, b) => {
    const diff = b.timestamp - a.timestamp

    if (diff === 0) {
      return a.__typename === 'TokenApproval' ? 1 : b.__typename === 'TokenApproval' ? -1 : 0
    }

    return diff
  })
}

/**
 * Every page of paginated data includes a limited amount of transactions within a certain period.
 * In standByTransactions we might have transactions from months ago. Whenever we load a new page
 * we only want to add those stand by transactions that are within the time period of the new page.
 * Otherwise, if we merge all the stand by transactins into the page it will cause more late transactions
 * that were already merged to be removed from the top of the list and move them to the bottom.
 * This will cause the screen to "shift", which we're trying to avoid.
 */
function mergeStandByTransactionsInRange(
  transactions: TokenTransaction[],
  standBy: TokenTransaction[]
) {
  if (transactions.length === 0) return []

  const allowedNetworks = getAllowedNetworksForTransfers()
  const max = transactions[0].timestamp
  const min = transactions.at(-1)!.timestamp

  const standByInRange = standBy.filter((tx) => tx.timestamp >= min && tx.timestamp <= max)
  const deduplicatedTransactions = deduplicateTransactions([...transactions, ...standByInRange])
  const transactionsFromAllowedNetworks = deduplicatedTransactions.filter((tx) =>
    allowedNetworks.includes(tx.networkId)
  )

  return transactionsFromAllowedNetworks
}

/**
 * Current implementation of allStandbyTransactionsSelector contains function
 * getSupportedNetworkIdsForApprovalTxsInHomefeed in its selectors list which triggers a lot of
 * unnecessary re-renders. This can be avoided if we join it's result in a string and memoize it,
 * similar to how it was done with useAllowedNetworkIdsForTransfers hook from queryHelpers.ts
 *
 * Not using existing selectors for pending/confirmed stand by transaction only cause they are
 * dependant on the un-memoized standbyTransactionsSelector selector which will break the new
 * pagination flow.
 *
 * Implementation of pending is identical to pendingStandbyTransactionsSelector.
 * Implementation of confirmed is identical to confirmedStandbyTransactionsSelector.
 */
function useStandByTransactions() {
  const standByTransactions = useSelector(allStandbyTransactionsSelector)
  const allowedNetworkForTransfers = useAllowedNetworksForTransfers()
  const supportedNetworksForApproval = useSupportedNetworksForApproval()

  return useMemo(() => {
    const transactionsFromAllowedNetworks = standByTransactions
      .filter((tx) => allowedNetworkForTransfers.includes(tx.networkId))
      .filter((tx) => {
        if (tx.type === TokenTransactionTypeV2.Approval) {
          return supportedNetworksForApproval.includes(tx.networkId)
        }

        return true
      })

    const pending: TokenTransaction[] = []
    const confirmed: TokenTransaction[] = []

    for (const tx of transactionsFromAllowedNetworks) {
      if (tx.status === TransactionStatus.Pending) {
        pending.push(standByTransactionToTokenTransaction(tx))
      } else {
        confirmed.push(tx)
      }
    }

    return { pending, confirmed }
  }, [standByTransactions, supportedNetworksForApproval, allowedNetworkForTransfers])
}

function renderItem({ item: tx }: { item: TokenTransaction; index: number }) {
  switch (tx.type) {
    case TokenTransactionTypeV2.Exchange:
    case TokenTransactionTypeV2.SwapTransaction:
    case TokenTransactionTypeV2.CrossChainSwapTransaction:
      return <SwapFeedItem key={tx.transactionHash} transaction={tx as TokenExchange} />
    case TokenTransactionTypeV2.Sent:
    case TokenTransactionTypeV2.Received:
      return <TransferFeedItem key={tx.transactionHash} transfer={tx as TokenTransfer} />
    case TokenTransactionTypeV2.NftSent:
    case TokenTransactionTypeV2.NftReceived:
      return <NftFeedItem key={tx.transactionHash} transaction={tx as NftTransfer} />
    case TokenTransactionTypeV2.Approval:
      return <TokenApprovalFeedItem key={tx.transactionHash} transaction={tx as TokenApproval} />
    case TokenTransactionTypeV2.EarnDeposit:
    case TokenTransactionTypeV2.EarnSwapDeposit:
    case TokenTransactionTypeV2.EarnWithdraw:
    case TokenTransactionTypeV2.EarnClaimReward:
      return <EarnFeedItem key={tx.transactionHash} transaction={tx as TokenEarn} />
  }
}

export default function TransactionFeedV2() {
  const address = useSelector(walletAddressSelector)
  const standByTransactions = useStandByTransactions()
  const [endCursor, setEndCursor] = useState(0)
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({ [FIRST_PAGE_TIMESTAMP]: [] })
  const { data, originalArgs, nextCursor, isFetching, error } = useTransactionFeedV2Query(
    { address: address!, endCursor },
    {
      skip: !address,
      refetchOnMountOrArgChange: true,
      selectFromResult: (result) => {
        return {
          ...result,
          nextCursor: result.data?.transactions.at(-1)?.timestamp,
        }
      },
    }
  )

  // Poll the first page
  useTransactionFeedV2Query(
    { address: address!, endCursor: FIRST_PAGE_TIMESTAMP },
    { skip: !address, pollingInterval: POLL_INTERVAL_MS }
  )

  useEffect(
    function updatePaginatedData() {
      if (isFetching) return

      const currentCursor = originalArgs?.endCursor // timestamp from the last transaction from the previous page.
      const transactions = data?.transactions || []

      setPaginatedData((prev) => {
        /**
         * Only update pagination data in the following scenarios:
         *   - if it's a first page (which is polling every POLL_INTERVAL)
         *   - if it's a page, that wasn't fetched yet
         */
        const isFirstPage = currentCursor === FIRST_PAGE_TIMESTAMP
        const pageDataIsAbsent =
          currentCursor !== FIRST_PAGE_TIMESTAMP && // not the first page
          currentCursor !== undefined && // it is SOME page
          prev[currentCursor] === undefined // data for this page wasn't fetched yet

        if (isFirstPage || pageDataIsAbsent) {
          const processedTransactions = mergeStandByTransactionsInRange(
            transactions,
            standByTransactions.confirmed
          )

          return { ...prev, [currentCursor!]: processedTransactions }
        }

        return prev
      })
    },
    [isFetching, data?.transactions, originalArgs?.endCursor, standByTransactions.confirmed]
  )

  const confirmedTransactions = useMemo(() => {
    const flattenedPages = Object.values(paginatedData).flat()
    const deduplicatedTransactions = deduplicateTransactions(flattenedPages)
    const sortedTransactions = sortTransactions(deduplicatedTransactions)
    return sortedTransactions
  }, [paginatedData])

  const sections = useMemo(() => {
    const noPendingTransactions = standByTransactions.pending.length === 0
    const noConfirmedTransactions = confirmedTransactions.length === 0
    if (noPendingTransactions && noConfirmedTransactions) return []
    return groupFeedItemsInSections(standByTransactions.pending, confirmedTransactions)
  }, [standByTransactions.pending, confirmedTransactions])

  if (!sections.length) {
    return getFeatureGate(StatsigFeatureGates.SHOW_GET_STARTED) ? (
      <GetStarted />
    ) : (
      <NoActivity loading={isFetching} error={error as any} />
    )
  }

  function fetchMoreTransactions() {
    if (nextCursor) {
      setEndCursor(nextCursor)
    }
  }

  return (
    <>
      <SectionList
        renderItem={renderItem}
        renderSectionHeader={(item) => <SectionHead text={item.section.title} />}
        sections={sections}
        keyExtractor={(item) => `${item.transactionHash}-${item.timestamp.toString()}`}
        keyboardShouldPersistTaps="always"
        testID="TransactionList"
        onEndReached={fetchMoreTransactions}
        initialNumToRender={20}
      />
      {isFetching && (
        <View style={styles.centerContainer} testID="TransactionList/loading">
          <ActivityIndicator style={styles.loadingIcon} size="large" color={colors.primary} />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  loadingIcon: {
    marginVertical: Spacing.Thick24,
    height: 108,
    width: 108,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
})
