import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import GetStarted from 'src/home/GetStarted'
import { useSelector } from 'src/redux/hooks'
import { RootState } from 'src/redux/reducers'
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
import { NetworkId, TransactionStatus, type TokenTransaction } from 'src/transactions/types'
import {
  groupFeedItemsInSections,
  standByTransactionToTokenTransaction,
} from 'src/transactions/utils'
import { walletAddressSelector } from 'src/web3/selectors'

type PaginatedData = {
  [timestamp: number]: TokenTransaction[]
}

// Query poll interval
const POLL_INTERVAL = 10000 // 10 secs
const FIRST_PAGE_TIMESTAMP = 0

function getAllowedNetworkIdsForTransfers() {
  return getMultichainFeatures().showTransfers.join(',').split(',') as NetworkId[]
}

/**
 * Every page of paginated data includes a limited amount of transactions within a certain period.
 * When the new page is added - we concatenate all the pages into a single array and sort them.
 * Currently, the sorting is necessary to ensure that approvals are always shown first if the
 * corresponding transaction has identical timestamp.
 *
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

  const allowedNetworks = getAllowedNetworkIdsForTransfers()
  const max = transactions[0].timestamp
  const min = transactions.at(-1)!.timestamp

  const standByInRange = standBy.filter((tx) => tx.timestamp >= min && tx.timestamp <= max)
  const mergedTransactions = [...transactions, ...standByInRange].reduce(
    (acc, tx) => {
      if (!allowedNetworks.includes(tx.networkId)) return acc

      if (!acc.used[tx.transactionHash]) {
        acc.used[tx.transactionHash] = true
        acc.list.push(tx)
      }
      return acc
    },
    { list: [] as TokenTransaction[], used: {} as { [hash: string]: true } }
  )

  const sortedTransactions = mergedTransactions.list.sort((a, b) => b.timestamp - a.timestamp)
  return sortedTransactions
}

/**
 * Current implementation of allStandbyTransactionsSelector contains function
 * getSupportedNetworkIdsForApprovalTxsInHomefeed in its selectors list which triggers a lot of
 * unnecessary re-renders. This can be avoided if we join it's result in a string and memoize it,
 * similar to how it was done with useAllowedNetworkIdsForTransfers hook from queryHelpers.ts
 *
 * Not using existing selectors for pending/confirmed stand by transaction only cause they are
 * dependant on the un-memoized allStandbyTransactionsSelector selector which will break the new
 * pagination flow.
 *
 * Implementation of pending is identical to pendingStandbyTransactionsSelector.
 * Implementation of confirmed is identical to confirmedStandbyTransactionsSelector.
 */
function useStandByTransactions() {
  const supportedNetworkrsForApproval = getSupportedNetworkIdsForApprovalTxsInHomefeed().join(',')
  const standByTransactions = useSelector(
    (state: RootState) => state.transactions.standbyTransactions
  )

  return useMemo(() => {
    const networkIds = supportedNetworkrsForApproval.split(',') as NetworkId[]
    return standByTransactions
      .filter((tx) => {
        return tx.__typename === 'TokenApproval' ? networkIds.includes(tx.networkId) : true
      })
      .reduce(
        (acc, tx) => {
          if (tx.status === TransactionStatus.Pending) {
            acc.pending.push(standByTransactionToTokenTransaction(tx))
          } else {
            acc.confirmed.push(tx)
          }

          return acc
        },
        { pending: [] as TokenTransaction[], confirmed: [] as TokenTransaction[] }
      )
  }, [standByTransactions, supportedNetworkrsForApproval])
}

function renderItem({ item: tx }: { item: TokenTransaction; index: number }) {
  switch (tx.__typename) {
    case 'TokenExchangeV3':
    case 'CrossChainTokenExchange':
      return <SwapFeedItem key={tx.transactionHash} transaction={tx} />
    case 'TokenTransferV3':
      return <TransferFeedItem key={tx.transactionHash} transfer={tx} />
    case 'NftTransferV3':
      return <NftFeedItem key={tx.transactionHash} transaction={tx} />
    case 'TokenApproval':
      return <TokenApprovalFeedItem key={tx.transactionHash} transaction={tx} />
    case 'EarnDeposit':
    case 'EarnSwapDeposit':
    case 'EarnWithdraw':
    case 'EarnClaimReward':
      return <EarnFeedItem key={tx.transactionHash} transaction={tx} />
  }
}

export default function TransactionFeedV2() {
  const address = useSelector(walletAddressSelector)
  const standByTransactions = useStandByTransactions()
  const [endCursor, setEndCursor] = useState(0)
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({})
  const { pageData, isFetching, error } = useTransactionFeedV2Query(
    { address: address!, endCursor },
    {
      skip: !address,
      refetchOnMountOrArgChange: true,
      selectFromResult: (result) => {
        return {
          ...result,

          /**
           * Under the hood, selectFromResult is passed to the "createSelector" function so we need
           * to memoize any processed data in order to keep the reference. We could move the whole
           * implementation outside of the component into a pure function but then we'll lose the type inference.
           *
           * Considering this function changes the type definition of useTransactionFeedV2Query result
           * object - it is easier to use "useMemo" to keep the type-safety.
           */
          // eslint-disable-next-line react-hooks/rules-of-hooks
          pageData: useMemo(
            () => ({
              currentCursor: result.originalArgs?.endCursor, // timestamp from the last transaction from the previous page.
              nextCursor: result.data?.transactions.at(-1)?.timestamp, // timestamp from the last transaction from the current page
              transactions: result.data?.transactions || [],
            }),
            [result]
          ),
        }
      },
    }
  )

  // Poll the first page
  useTransactionFeedV2Query(
    { address: address!, endCursor: FIRST_PAGE_TIMESTAMP },
    { skip: !address, pollingInterval: POLL_INTERVAL }
  )

  useEffect(() => {
    if (isFetching) return

    setPaginatedData((prev) => {
      /**
       * We are going to poll only the first page so if we already fetched other pages -
       * just leave them as is. All new transactions are only gonna be added to the top of the first page.
       */
      if (pageData.currentCursor === FIRST_PAGE_TIMESTAMP && prev[pageData.currentCursor]) {
        return prev
      }

      /**
       * undefined currentCursor means that we've received empty transactions which means this is
       * the last page.
       */
      if (pageData.currentCursor === undefined) {
        return prev
      }

      const transactions = mergeStandByTransactionsInRange(
        pageData.transactions,
        standByTransactions.confirmed
      )

      return { ...prev, [pageData.currentCursor]: transactions }
    })
  }, [isFetching, pageData, standByTransactions.confirmed])

  const pendingTransactions = useMemo(() => {
    const allowedNetworks = getAllowedNetworkIdsForTransfers()
    return standByTransactions.pending.filter((tx) => {
      return allowedNetworks.includes(tx.networkId)
    })
  }, [standByTransactions.pending])

  const confirmedTransactions = useMemo(() => {
    return Object.values(paginatedData)
      .flat()
      .reduce(
        (acc, tx) => {
          if (!acc.used[tx.transactionHash]) acc.list.push(tx)
          return acc
        },
        {
          list: [] as TokenTransaction[],
          used: {} as { [hash: string]: true },
        }
      )
      .list.sort((a, b) => {
        const diff = b.timestamp - a.timestamp

        /**
         * If the timestamps are the same, most likely one of the transactions is an approval.
         * On the feed we want to show the approval first.
         */
        if (diff === 0) {
          return a.__typename === 'TokenApproval' ? 1 : b.__typename === 'TokenApproval' ? -1 : 0
        }

        return diff
      })
  }, [paginatedData])

  const sections = useMemo(() => {
    const noTransactions = pendingTransactions.length === 0 && confirmedTransactions.length === 0
    if (noTransactions) return []
    return groupFeedItemsInSections(pendingTransactions, confirmedTransactions)
  }, [pendingTransactions, confirmedTransactions])

  if (!sections.length) {
    return getFeatureGate(StatsigFeatureGates.SHOW_GET_STARTED) ? (
      <GetStarted />
    ) : (
      <NoActivity loading={isFetching} error={error as any} />
    )
  }

  function fetchMoreTransactions() {
    if (pageData.nextCursor) {
      setEndCursor(pageData.nextCursor)
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
