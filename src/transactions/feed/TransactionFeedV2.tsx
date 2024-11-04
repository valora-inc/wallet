import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native'
import Toast from 'react-native-simple-toast'
import { showToast } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SwapEvents } from 'src/analytics/Events'
import SectionHead from 'src/components/SectionHead'
import GetStarted from 'src/home/GetStarted'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { store } from 'src/redux/store'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { useTransactionFeedV2Query } from 'src/transactions/api'
import ClaimRewardFeedItem from 'src/transactions/feed/ClaimRewardFeedItem'
import DepositOrWithdrawFeedItem from 'src/transactions/feed/DepositOrWithdrawFeedItem'
import EarnFeedItem from 'src/transactions/feed/EarnFeedItem'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import TokenApprovalFeedItem from 'src/transactions/feed/TokenApprovalFeedItem'
import TransferFeedItem from 'src/transactions/feed/TransferFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import { allStandbyTransactionsSelector, feedFirstPageSelector } from 'src/transactions/selectors'
import {
  FeeType,
  TokenTransactionTypeV2,
  TransactionStatus,
  type NetworkId,
  type TokenExchange,
  type TokenTransaction,
} from 'src/transactions/types'
import {
  groupFeedItemsInSections,
  standByTransactionToTokenTransaction,
} from 'src/transactions/utils'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

type PaginatedData = {
  [FIRST_PAGE_CURSOR]: TokenTransaction[]
  [endCursor: string]: TokenTransaction[]
}

const FIRST_PAGE_CURSOR = 'FIRST_PAGE'
const MIN_NUM_TRANSACTIONS_NECESSARY_FOR_SCROLL = 10
const POLL_INTERVAL_MS = 10_000 // 10 sec
const TAG = 'transactions/feed/TransactionFeedV2'

function getAllowedNetworksForTransfers() {
  return getMultichainFeatures().showTransfers
}

function trackCompletionOfCrossChainSwaps(transactions: TokenExchange[]) {
  const tokensById = tokensByIdSelector(store.getState(), getSupportedNetworkIdsForSwap())

  for (const tx of transactions) {
    const toTokenPrice = tokensById[tx.inAmount.tokenId]?.priceUsd
    const fromTokenPrice = tokensById[tx.outAmount.tokenId]?.priceUsd

    const networkFee = tx.fees.find((fee) => fee.type === FeeType.SecurityFee)
    const networkFeeTokenPrice = networkFee && tokensById[networkFee?.amount.tokenId]?.priceUsd
    const appFee = tx.fees.find((fee) => fee.type === FeeType.AppFee)
    const appFeeTokenPrice = appFee && tokensById[appFee?.amount.tokenId]?.priceUsd
    const crossChainFee = tx.fees.find((fee) => fee.type === FeeType.CrossChainFee)
    const crossChainFeeTokenPrice =
      crossChainFee && tokensById[crossChainFee?.amount.tokenId]?.priceUsd

    AppAnalytics.track(SwapEvents.swap_execute_success, {
      swapType: 'cross-chain',
      swapExecuteTxId: tx.transactionHash,
      toTokenId: tx.inAmount.tokenId,
      toTokenAmount: tx.inAmount.value.toString(),
      toTokenAmountUsd: toTokenPrice
        ? BigNumber(tx.inAmount.value).times(toTokenPrice).toNumber()
        : undefined,
      fromTokenId: tx.outAmount.tokenId,
      fromTokenAmount: tx.outAmount.value.toString(),
      fromTokenAmountUsd: fromTokenPrice
        ? BigNumber(tx.outAmount.value).times(fromTokenPrice).toNumber()
        : undefined,
      networkFeeTokenId: networkFee?.amount.tokenId,
      networkFeeAmount: networkFee?.amount.value.toString(),
      networkFeeAmountUsd:
        networkFeeTokenPrice && networkFee.amount.value
          ? BigNumber(networkFee.amount.value).times(networkFeeTokenPrice).toNumber()
          : undefined,
      appFeeTokenId: appFee?.amount.tokenId,
      appFeeAmount: appFee?.amount.value.toString(),
      appFeeAmountUsd:
        appFeeTokenPrice && appFee.amount.value
          ? BigNumber(appFee.amount.value).times(appFeeTokenPrice).toNumber()
          : undefined,
      crossChainFeeTokenId: crossChainFee?.amount.tokenId,
      crossChainFeeAmount: crossChainFee?.amount.value.toString(),
      crossChainFeeAmountUsd:
        crossChainFeeTokenPrice && crossChainFee.amount.value
          ? BigNumber(crossChainFee.amount.value).times(crossChainFeeTokenPrice).toNumber()
          : undefined,
    })
  }
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
      if (a.type === TokenTransactionTypeV2.Approval) return 1
      if (b.type === TokenTransactionTypeV2.Approval) return -1
      return 0
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
 *
 * Note: when merging the first page – stand by transactions might include some new pending transaction.
 * In order to include them in the merged list we need to also check if the stand by transaction is newer
 * than the max timestamp from the page. But this must only happen for the first page as otherwise any
 * following page would include stand by transactions from previous pages.
 */
function mergeStandByTransactionsInRange({
  transactions,
  standByTransactions,
  currentCursor,
  isLastPage,
}: {
  transactions: TokenTransaction[]
  standByTransactions: TokenTransaction[]
  currentCursor: keyof PaginatedData
  isLastPage: boolean
}): TokenTransaction[] {
  /**
   * If the data from the first page is empty - there's no successful transactions in the wallet.
   * Maybe the user executed a single transaction, it failed and now it's in the standByTransactions.
   * In this case we need to show whatever we've got in standByTransactions, until we have some
   * paginated data to merge it with.
   */
  const isFirstPage = currentCursor === FIRST_PAGE_CURSOR
  if (isFirstPage && transactions.length === 0) {
    return standByTransactions
  }

  // return empty array for any page other than the first
  if (transactions.length === 0) {
    return []
  }

  const allowedNetworks = getAllowedNetworksForTransfers()
  const max = transactions[0].timestamp
  const min = transactions.at(-1)!.timestamp

  const standByInRange = standByTransactions.filter((tx) => {
    const inRange = tx.timestamp >= min && tx.timestamp <= max
    const newTransaction = isFirstPage && tx.timestamp > max
    const veryOldTransaction = isLastPage && tx.timestamp < min
    return inRange || newTransaction || veryOldTransaction
  })
  const deduplicatedTransactions = deduplicateTransactions([...transactions, ...standByInRange])
  const transactionsFromAllowedNetworks = deduplicatedTransactions.filter((tx) =>
    allowedNetworks.includes(tx.networkId)
  )

  return transactionsFromAllowedNetworks
}

/**
 * Current implementation of standbyTransactionsSelector contains function
 * getSupportedNetworkIdsForApprovalTxsInHomefeed in its selectors which triggers a lot of
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

  return useMemo(() => {
    const transactionsFromAllowedNetworks = standByTransactions.filter((tx) =>
      allowedNetworkForTransfers.includes(tx.networkId)
    )

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
  }, [standByTransactions, allowedNetworkForTransfers])
}

/**
 * In order to properly detect if any of the existing pending transactions turned into completed
 * we need to listen to the updates of stand by transactions. Whenever we detect that a completed
 * transaction was in pending status on previous render - we consider it a newly completed transaction.
 */
function useNewlyCompletedTransactions(
  standByTransactions: ReturnType<typeof useStandByTransactions>
) {
  const [{ hasNewlyCompletedTransactions, newlyCompletedCrossChainSwaps }, setPreviousStandBy] =
    useState({
      pending: [] as TokenTransaction[],
      confirmed: [] as TokenTransaction[],
      newlyCompletedCrossChainSwaps: [] as TokenExchange[],
      hasNewlyCompletedTransactions: false,
    })

  useEffect(
    function updatePrevStandBy() {
      setPreviousStandBy((prev) => {
        const confirmedHashes = standByTransactions.confirmed.map((tx) => tx.transactionHash)
        const newlyCompleted = prev.pending.filter((tx) => {
          return confirmedHashes.includes(tx.transactionHash)
        })
        const newlyCompletedCrossChainSwaps = newlyCompleted.filter(
          (tx): tx is TokenExchange => tx.type === TokenTransactionTypeV2.CrossChainSwapTransaction
        )

        return {
          pending: [...standByTransactions.pending],
          confirmed: [...standByTransactions.confirmed],
          newlyCompletedCrossChainSwaps,
          hasNewlyCompletedTransactions: !!newlyCompleted.length,
        }
      })
    },
    [standByTransactions]
  )

  return {
    hasNewlyCompletedTransactions,
    newlyCompletedCrossChainSwaps,
  }
}

function renderItem({ item: tx }: { item: TokenTransaction }) {
  switch (tx.type) {
    case TokenTransactionTypeV2.Exchange:
    case TokenTransactionTypeV2.SwapTransaction:
    case TokenTransactionTypeV2.CrossChainSwapTransaction:
      return <SwapFeedItem key={tx.transactionHash} transaction={tx} />
    case TokenTransactionTypeV2.Sent:
    case TokenTransactionTypeV2.Received:
      return <TransferFeedItem key={tx.transactionHash} transfer={tx} />
    case TokenTransactionTypeV2.NftSent:
    case TokenTransactionTypeV2.NftReceived:
      return <NftFeedItem key={tx.transactionHash} transaction={tx} />
    case TokenTransactionTypeV2.Approval:
      return <TokenApprovalFeedItem key={tx.transactionHash} transaction={tx} />
    case TokenTransactionTypeV2.Deposit:
    case TokenTransactionTypeV2.Withdraw:
      return <DepositOrWithdrawFeedItem key={tx.transactionHash} transaction={tx} />
    case TokenTransactionTypeV2.ClaimReward:
      return <ClaimRewardFeedItem key={tx.transactionHash} transaction={tx} />
    case TokenTransactionTypeV2.EarnDeposit:
    case TokenTransactionTypeV2.EarnSwapDeposit:
    case TokenTransactionTypeV2.EarnWithdraw:
    case TokenTransactionTypeV2.EarnClaimReward:
      return <EarnFeedItem key={tx.transactionHash} transaction={tx} />
  }
}

export default function TransactionFeedV2() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const standByTransactions = useStandByTransactions()
  const feedFirstPage = useSelector(feedFirstPageSelector)
  const { hasNewlyCompletedTransactions, newlyCompletedCrossChainSwaps } =
    useNewlyCompletedTransactions(standByTransactions)
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined)
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({
    [FIRST_PAGE_CURSOR]: feedFirstPage,
  })

  const { data, isFetching, error } = useTransactionFeedV2Query(
    { address: address!, endCursor, localCurrencyCode },
    { skip: !address, refetchOnMountOrArgChange: true }
  )

  /**
   * This is the same hook as above and it only polls the first page of the feed. Thanks to how
   * RTK-Query stores the fetched data, we know that using "useTransactionFeedV2Query" with the
   * same arguments in multiple places will always point to the same data. This means that we can
   * trigger fetch request here and once data arrives - the same hook above will also get the same data.
   */
  useTransactionFeedV2Query(
    { address: address!, localCurrencyCode, endCursor: undefined },
    { skip: !address, pollingInterval: POLL_INTERVAL_MS }
  )

  /**
   * There are only 2 scenarios when we actually update the paginated data:
   *
   * 1. Always update the first page. First page will be polled every "POLL_INTERVAL"
   *    milliseconds. Whenever new data arrives - replace the existing first page data
   *    with the new data as it might contain some updated information about the transactions
   *    that are already present or new transactions. The first page should not contain an
   *    empty array, unless wallet doesn't have any transactions at all.
   *
   * 2. Data for every page after the first page is only set once. Considering the big enough
   *    page size (currently 100 transactions per page) all the pending transactions are supposed
   *    to arrive in the first page so everything after the first page can be considered confirmed
   *    (completed/failed). For this reason, there's no point in updating the data as its very unlikely to update.
   */
  useEffect(
    function updatePaginatedData() {
      if (isFetching || !data) return

      const isLastPage = !data.pageInfo.hasNextPage
      const currentCursor = data.pageInfo.hasPreviousPage
        ? data.pageInfo.startCursor
        : FIRST_PAGE_CURSOR

      setPaginatedData((prev) => {
        const isFirstPage = currentCursor === FIRST_PAGE_CURSOR
        const pageDataIsAbsent =
          currentCursor !== FIRST_PAGE_CURSOR && // not the first page
          currentCursor !== undefined && // it is a page after the first
          prev[currentCursor] === undefined // data for this page wasn't stored yet

        if (isFirstPage || pageDataIsAbsent) {
          const mergedTransactions = mergeStandByTransactionsInRange({
            transactions: data.transactions,
            standByTransactions: standByTransactions.confirmed,
            currentCursor,
            isLastPage,
          })

          return { ...prev, [currentCursor!]: mergedTransactions }
        }

        return prev
      })
    },
    [isFetching, data, standByTransactions.confirmed]
  )

  useEffect(
    function handleError() {
      if (error === undefined) return

      Logger.warn(TAG, 'Error while fetching transactions', error)
      dispatch(showToast(t('transactionFeed.error.fetchError'), null, null, null))
    },
    [error]
  )

  useEffect(
    function vibrateForNewlyCompletedTransactions() {
      const isFirstPage = data?.pageInfo.hasPreviousPage
        ? data.pageInfo.startCursor
        : FIRST_PAGE_CURSOR

      if (isFirstPage && hasNewlyCompletedTransactions) {
        vibrateSuccess()
      }
    },
    [hasNewlyCompletedTransactions, data?.pageInfo]
  )

  useEffect(
    function trackCrossChainSwaps() {
      if (newlyCompletedCrossChainSwaps.length) {
        trackCompletionOfCrossChainSwaps(newlyCompletedCrossChainSwaps)
      }
    },
    [newlyCompletedCrossChainSwaps]
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
      <NoActivity loading={isFetching} error={error} />
    )
  }

  function fetchMoreTransactions() {
    if (data?.pageInfo.hasNextPage && data?.pageInfo.endCursor) {
      setEndCursor(data.pageInfo.endCursor)
      return
    }

    const totalTxCount = standByTransactions.pending.length + confirmedTransactions.length
    if (totalTxCount > MIN_NUM_TRANSACTIONS_NECESSARY_FOR_SCROLL) {
      Toast.showWithGravity(t('noMoreTransactions'), Toast.SHORT, Toast.CENTER)
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
          <ActivityIndicator style={styles.loadingIcon} size="large" color={colors.accent} />
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
