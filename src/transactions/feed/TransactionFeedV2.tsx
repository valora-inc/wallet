import BigNumber from 'bignumber.js'
import { isEqual } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SwapEvents } from 'src/analytics/Events'
import { NotificationVariant } from 'src/components/InLineNotification'
import SectionHead from 'src/components/SectionHead'
import Toast from 'src/components/Toast'
import ActionsCarousel from 'src/home/ActionsCarousel'
import GetStarted from 'src/home/GetStarted'
import NotificationBox from 'src/home/NotificationBox'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { store } from 'src/redux/store'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
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
import {
  feedFirstPageSelector,
  formattedStandByTransactionsSelector,
} from 'src/transactions/selectors'
import { updateFeedFirstPage } from 'src/transactions/slice'
import {
  FeeType,
  TokenTransactionTypeV2,
  TransactionStatus,
  type NetworkId,
  type TokenExchange,
  type TokenTransaction,
} from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

type PaginatedData = {
  [FIRST_PAGE_CURSOR]: TokenTransaction[]
  [endCursor: string]: TokenTransaction[]
}

const FIRST_PAGE_CURSOR = 'FIRST_PAGE'
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

function categorizeTransactions(transactions: TokenTransaction[]) {
  const pending: TokenTransaction[] = []
  const confirmed: TokenTransaction[] = []
  const confirmedHashes: string[] = []

  for (const tx of transactions) {
    if (tx.status === TransactionStatus.Pending) {
      pending.push(tx)
    } else {
      confirmed.push(tx)
      confirmedHashes.push(tx.transactionHash)
    }
  }

  return { pending, confirmed, confirmedHashes }
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

  const max = transactions[0].timestamp
  const min = transactions.at(-1)!.timestamp

  const standByInRange = standByTransactions.filter((tx) => {
    const inRange = tx.timestamp >= min && tx.timestamp <= max
    const newTransaction = isFirstPage && tx.timestamp > max
    const veryOldTransaction = isLastPage && tx.timestamp < min
    return inRange || newTransaction || veryOldTransaction
  })
  const deduplicatedTransactions = deduplicateTransactions([...transactions, ...standByInRange])
  const sortedTransactions = sortTransactions(deduplicatedTransactions)
  return sortedTransactions
}

/**
 * In order to properly detect if any of the existing pending transactions turned into completed
 * we need to listen to the updates of stand by transactions. Whenever we detect that a completed
 * transaction was in pending status on previous render - we consider it a newly completed transaction.
 */
function useNewlyCompletedTransactions(standByTransactions: TokenTransaction[]) {
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
        const { pending, confirmed, confirmedHashes } = categorizeTransactions(standByTransactions)
        const newlyCompleted = prev.pending.filter((tx) => {
          return confirmedHashes.includes(tx.transactionHash)
        })
        const newlyCompletedCrossChainSwaps = newlyCompleted.filter(
          (tx): tx is TokenExchange => tx.type === TokenTransactionTypeV2.CrossChainSwapTransaction
        )

        return {
          pending,
          confirmed,
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

  const showGetStarted = getFeatureGate(StatsigFeatureGates.SHOW_GET_STARTED)
  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)

  const allowedNetworkForTransfers = useAllowedNetworksForTransfers()
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const standByTransactions = useSelector(formattedStandByTransactionsSelector)
  const feedFirstPage = useSelector(feedFirstPageSelector)
  const { hasNewlyCompletedTransactions, newlyCompletedCrossChainSwaps } =
    useNewlyCompletedTransactions(standByTransactions)
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined)
  const [paginatedData, setPaginatedData] = useState<PaginatedData>({
    [FIRST_PAGE_CURSOR]: feedFirstPage,
  })
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading')
  const [allTransactionsShown, setAllTransactionsShown] = useState(false)

  const { data, isFetching, error, refetch } = useTransactionFeedV2Query(
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

  useEffect(
    // The status state variable is set to loading when a fetch is triggered on
    // component mount and on pull to refresh, which allows us to hide the
    // refresh spinner on background poll / fetch more pages. This effect will
    // dismiss the loader by resetting this variable.
    function dismissLoading() {
      if (!isFetching) {
        setStatus('idle')
      }
    },
    [isFetching]
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
            standByTransactions,
            currentCursor,
            isLastPage,
          })

          return { ...prev, [currentCursor!]: mergedTransactions }
        }

        return prev
      })
    },
    [isFetching, data, standByTransactions]
  )

  useEffect(
    function hasLoadedAllTransactions() {
      if (data && !data.pageInfo.hasNextPage && !data.pageInfo.endCursor) {
        setAllTransactionsShown(true)
      }
    },
    [data]
  )

  useEffect(
    function handleError() {
      if (error === undefined) return

      Logger.warn(TAG, 'Error while fetching transactions', error)

      // Suppress errors for background polling results, but show errors when
      // data is explicitly requested by the user. Currently, this applies to
      // scroll actions for loading additional pages and the initial wallet load
      // if no cached transactions exist.
      if (('hasAfterCursor' in error && error.hasAfterCursor) || feedFirstPage.length === 0) {
        setStatus('error')
      }
    },
    [error, feedFirstPage]
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

  useEffect(
    function updatePersistedFeedFirstPage() {
      const isFirstPage = !data?.pageInfo.hasPreviousPage
      if (isFirstPage) {
        const firstPageData = paginatedData[FIRST_PAGE_CURSOR]
        if (!isEqual(firstPageData, feedFirstPage)) {
          // Prevent the action from triggering on every polling interval. Only
          // dispatch the action when there is a data change, such as new
          // transactions. This action initiates side effects, like refreshing
          // the token balance, so we avoid dispatching it on every poll to
          // reduce unnecessary work.
          dispatch(updateFeedFirstPage({ transactions: firstPageData }))
        }
      }
    },
    [paginatedData, data?.pageInfo]
  )

  const sections = useMemo(() => {
    const flattenedPages = Object.values(paginatedData).flat()
    const deduplicatedTransactions = deduplicateTransactions(flattenedPages)
    const sortedTransactions = sortTransactions(deduplicatedTransactions)
    const allowedTransactions = sortedTransactions.filter((tx) =>
      allowedNetworkForTransfers.includes(tx.networkId)
    )

    if (allowedTransactions.length === 0) return []

    const { pending, confirmed } = categorizeTransactions(allowedTransactions)
    return groupFeedItemsInSections(pending, confirmed)
  }, [paginatedData, allowedNetworkForTransfers])

  function fetchMoreTransactions() {
    if (data?.pageInfo.hasNextPage && data?.pageInfo.endCursor) {
      setEndCursor(data.pageInfo.endCursor)
    }
  }

  function handleRetryFetch() {
    // refetch the transaction feed with the last known cursor, since this
    // toast should only be displayed on error fetching next page or initial
    // page if no transactions have been fetched before.
    setStatus('loading')
    return refetch()
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
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={handleRetryFetch}
            colors={[colors.accent]}
          />
        }
        onEndReached={fetchMoreTransactions}
        initialNumToRender={20}
        ListHeaderComponent={
          <>
            <ActionsCarousel />
            <NotificationBox showOnlyHomeScreenNotifications={true} />
          </>
        }
        ListEmptyComponent={
          showGetStarted && !showUKCompliantVariant ? <GetStarted /> : <NoActivity />
        }
        ListFooterComponent={
          <>
            {/* prevent loading indicator due to polling from showing at the bottom of the screen */}
            {isFetching && !allTransactionsShown && (
              <View style={styles.centerContainer} testID="TransactionList/loading">
                <ActivityIndicator style={styles.loadingIcon} size="large" color={colors.accent} />
              </View>
            )}
            {allTransactionsShown && sections.length > 0 && (
              <Text style={styles.allTransactionsText}>
                {t('transactionFeed.allTransactionsShown')}
              </Text>
            )}
          </>
        }
      />
      <Toast
        showToast={status === 'error'}
        variant={NotificationVariant.Error}
        description={t('transactionFeed.error.fetchError')}
        ctaLabel={t('transactionFeed.fetchErrorRetry')}
        onPressCta={handleRetryFetch}
        swipeable
        onDismiss={() => {
          setStatus('idle')
        }}
      />
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
  allTransactionsText: {
    ...typeScale.bodySmall,
    color: colors.gray3,
    textAlign: 'center',
    marginHorizontal: Spacing.Regular16,
    marginVertical: Spacing.Thick24,
  },
})
