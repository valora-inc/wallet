import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import GetStarted from 'src/home/GetStarted'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import NoActivity from 'src/transactions/NoActivity'
import { useTransactionFeedV2Query } from 'src/transactions/api'
import EarnFeedItem from 'src/transactions/feed/EarnFeedItem'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import TokenApprovalFeedItem from 'src/transactions/feed/TokenApprovalFeedItem'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import { pendingStandbyTransactionsSelector } from 'src/transactions/reducer'
import {
  type NetworkId,
  type NftTransfer,
  type TokenApproval,
  type TokenEarn,
  type TokenExchange,
  type TokenTransaction,
  TokenTransactionTypeV2,
  type TokenTransfer,
} from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import { walletAddressSelector } from 'src/web3/selectors'

type PaginatedData = {
  [timestamp: number]: TokenTransaction[]
}

// Query poll interval
const POLL_INTERVAL_MS = 10000 // 10 sec
const FIRST_PAGE_TIMESTAMP = 0

function getAllowedNetworkIdsForTransfers() {
  return getMultichainFeatures().showTransfers.join(',').split(',') as NetworkId[]
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
  const pendingStandByTransactions = useSelector(pendingStandbyTransactionsSelector)
  const [endCursor, setEndCursor] = useState(0)
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({ [FIRST_PAGE_TIMESTAMP]: [] })
  const { pageData, isFetching, error } = useTransactionFeedV2Query(
    { address: address!, endCursor },
    {
      skip: !address,
      refetchOnMountOrArgChange: true,
      selectFromResult: (result) => {
        return {
          ...result,
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
    { skip: !address, pollingInterval: POLL_INTERVAL_MS }
  )

  useEffect(
    function updatePaginatedData() {
      if (isFetching) return

      setPaginatedData((prev) => {
        /**
         * Only update pagination data in the following scenarios:
         *   - if it's a first page (which is polling every POLL_INTERVAL)
         *   - if it's a page, that wasn't fetched yet
         */
        const isFirstPage = pageData.currentCursor === FIRST_PAGE_TIMESTAMP
        const pageDataIsAbsent =
          pageData.currentCursor !== FIRST_PAGE_TIMESTAMP && // not the first page
          pageData.currentCursor !== undefined && // it is SOME page
          prev[pageData.currentCursor] === undefined // data for this page wasn't fetched yet

        if (isFirstPage || pageDataIsAbsent) {
          return { ...prev, [pageData.currentCursor!]: pageData.transactions }
        }

        return prev
      })
    },
    [isFetching, pageData]
  )

  const pendingTransactions = useMemo(() => {
    const allowedNetworks = getAllowedNetworkIdsForTransfers()
    return pendingStandByTransactions.filter((tx) => {
      return allowedNetworks.includes(tx.networkId)
    })
  }, [pendingStandByTransactions])

  /**
   * This function uses the same deduplication approach as "deduplicateTransactions"
   * function from queryHelper.ts but only for a single flattened array instead of
   * two separate arrays.
   */
  const confirmedTransactions = useMemo(() => {
    const flattenedPages = Object.values(paginatedData).flat()
    const transactionMap: { [txHash: string]: TokenTransaction } = {}

    for (const tx of flattenedPages) {
      transactionMap[tx.transactionHash] = tx
    }

    const deduplicatedTransactions = Object.values(transactionMap)
    const sortedTransactions = deduplicatedTransactions.sort((a, b) => {
      const diff = b.timestamp - a.timestamp
      if (diff === 0) {
        // if the timestamps are the same, most likely one of the transactions
        // is an approval. on the feed we want to show the approval first.
        return a.type === TokenTransactionTypeV2.Approval
          ? 1
          : b.type === TokenTransactionTypeV2.Approval
            ? -1
            : 0
      }
      return diff
    })

    return sortedTransactions
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
