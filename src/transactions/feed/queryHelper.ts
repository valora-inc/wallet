import BigNumber from 'bignumber.js'
import { isEmpty } from 'lodash'
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-simple-toast'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SwapEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { AppDispatch, store } from 'src/redux/store'
import { getMultichainFeatures } from 'src/statsig/index'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { updateTransactions } from 'src/transactions/actions'
import {
  completedTxHashesByNetworkIdSelector,
  pendingStandbyTxHashesByNetworkIdSelector,
  pendingTxHashesByNetworkIdSelector,
  transactionsSelector,
} from 'src/transactions/reducer'
import {
  FeeType,
  NetworkId,
  TokenExchange,
  TokenTransaction,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { gql } from 'src/utils/gql'
import config from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

const MIN_NUM_TRANSACTIONS = 10

export interface QueryHookResult {
  loading: boolean
  error: Error | undefined
  transactions: TokenTransaction[]
  fetchingMoreTransactions: boolean
  fetchMoreTransactions: () => void
}
interface PageInfo {
  startCursor: string | null
  endCursor: string | null
  hasNextPage: boolean
  hasPreviousPage: boolean
}
export interface QueryResponse {
  data: {
    tokenTransactionsV3: {
      transactions: TokenTransaction[]
      pageInfo: PageInfo
    }
  }
}

type ActiveRequests = { [key in NetworkId]: boolean }

const TAG = 'transactions/feed/queryHelper'

// Query poll interval
const POLL_INTERVAL = 10000 // 10 secs

// returns a new array that is the combination of the two transaction arrays, with
// duplicated transactions removed. In the case of duplicate transactions, the
// one from the incomingTx array is kept.
export const deduplicateTransactions = (
  existingTxs: TokenTransaction[],
  incomingTxs: TokenTransaction[]
) => {
  const transactionsByTxHash: { [txHash: string]: TokenTransaction } = {}
  const combinedTxs = [...existingTxs, ...incomingTxs]
  combinedTxs.forEach((transaction) => {
    transactionsByTxHash[transaction.transactionHash] = transaction
  })

  return Object.values(transactionsByTxHash)
}

export function useAllowedNetworkIdsForTransfers() {
  // return a string to help react memoization
  const allowedNetworkIdsString = getMultichainFeatures().showTransfers.join(',')
  // N.B: This fetch-time filtering does not suffice to prevent non-Celo TXs from appearing
  // on the home feed, since they get cached in Redux -- this is just a network optimization.
  return useMemo(() => {
    return allowedNetworkIdsString.split(',') as NetworkId[]
  }, [allowedNetworkIdsString])
}

export function useFetchTransactions(): QueryHookResult {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const pendingTxHashesByNetwork = useSelector(pendingTxHashesByNetworkIdSelector)
  const completedTxHashesByNetwork = useSelector(completedTxHashesByNetworkIdSelector)
  const cachedTransactions = useSelector(transactionsSelector)
  const pendingStandbyTxHashesByNetwork = useSelector(pendingStandbyTxHashesByNetworkIdSelector)
  const allowedNetworkIds = useAllowedNetworkIdsForTransfers()

  // Track which networks are currently fetching transactions via polling to avoid duplicate requests
  const [activePollingRequests, setActivePollingRequestsState] = useState<ActiveRequests>(
    allowedNetworkIds.reduce((acc, networkId) => {
      acc[networkId] = false
      return acc
    }, {} as ActiveRequests)
  )

  // Track which networks are currently fetching transactions via pagination to avoid duplicate requests
  const [activePaginationRequests, setActivePaginationRequestsState] = useState<ActiveRequests>(
    allowedNetworkIds.reduce((acc, networkId) => {
      acc[networkId] = false
      return acc
    }, {} as ActiveRequests)
  )

  // Prevent unnecessary re-renders
  const setActivePollingRequests = useCallback(
    (updateFunc: (prevState: ActiveRequests) => ActiveRequests) => {
      setActivePollingRequestsState((prevState) => {
        const updatedState = updateFunc(prevState)
        return updatedState
      })
    },
    [setActivePollingRequestsState]
  )
  const setActivePaginationRequests = useCallback(
    (updateFunc: (prevState: ActiveRequests) => ActiveRequests) => {
      setActivePaginationRequestsState((prevState) => {
        const updatedState = updateFunc(prevState)
        return updatedState
      })
    },
    [setActivePaginationRequestsState]
  )

  // Track cumulative transactions and most recent page info for all chains in one
  // piece of state so that they don't become out of sync.
  const [fetchedResult, setFetchedResult] = useState<{
    transactions: TokenTransaction[]
    pageInfo: { [key in NetworkId]?: PageInfo | null }
    hasTransactionsOnCurrentPage: { [key in NetworkId]?: boolean }
  }>({
    transactions: cachedTransactions,
    pageInfo: allowedNetworkIds.reduce((acc, cur) => {
      return {
        ...acc,
        [cur]: null,
      }
    }, {}),
    hasTransactionsOnCurrentPage: allowedNetworkIds.reduce((acc, cur) => {
      return {
        ...acc,
        [cur]: false,
      }
    }, {}),
  })

  const [fetchingMoreTransactions, setFetchingMoreTransactions] = useState(false)

  useEffect(() => {
    // kick off a request for new transactions, and then poll for new
    // transactions periodically
    void pollNewTransactions.execute()

    const id = setInterval(() => {
      void pollNewTransactions.execute()
    }, POLL_INTERVAL)

    return () => clearInterval(id)
  }, [])

  const handleError = (error: Error) => {
    Logger.error(TAG, 'Error while fetching transactions', error)
  }

  // Query for new transaction every POLL_INTERVAL
  const pollNewTransactions = useAsyncCallback(
    async () => {
      await queryTransactionsFeed({
        address,
        localCurrencyCode,
        params: allowedNetworkIds.map((networkId) => {
          return { networkId }
        }),
        onNetworkResponse: handlePollResponse({
          pageInfo: fetchedResult.pageInfo,
          setFetchedResult,
          completedTxHashesByNetwork,
          pendingTxHashesByNetwork,
          pendingStandbyTxHashesByNetwork,
          dispatch,
        }),
        setActiveRequests: setActivePollingRequests,
        activeRequests: activePollingRequests,
      })
    },
    {
      onError: handleError,
    }
  )

  // Query for more transactions if requested
  useAsync(
    async () => {
      if (!anyNetworkHasMorePages(fetchedResult.pageInfo)) {
        setFetchingMoreTransactions(false)
        return
      }
      // If we're requested to fetch more transactions, only fetch them for networks
      // that actually have further pages.
      const params: Array<{
        networkId: NetworkId
        afterCursor?: string | null
      }> = (Object.entries(fetchedResult.pageInfo) as Array<[NetworkId, PageInfo | null]>)
        .map(([networkId, pageInfo]) => {
          return { networkId, afterCursor: pageInfo?.endCursor }
        })
        .filter((networkParams) => fetchedResult.pageInfo[networkParams.networkId]?.hasNextPage)
      await queryTransactionsFeed({
        address,
        localCurrencyCode,
        params,
        onNetworkResponse: (networkId, result) => {
          const returnedTransactions = result?.data.tokenTransactionsV3?.transactions ?? []
          const returnedPageInfo = result?.data.tokenTransactionsV3?.pageInfo ?? null
          if (returnedTransactions.length || returnedPageInfo?.hasNextPage) {
            setFetchedResult((prev) => ({
              transactions: deduplicateTransactions(prev.transactions, returnedTransactions),
              pageInfo: { ...prev.pageInfo, [networkId]: returnedPageInfo },
              hasTransactionsOnCurrentPage: {
                ...prev.hasTransactionsOnCurrentPage,
                [networkId]: returnedTransactions.length > 0,
              },
            }))
          }
        },
        setActiveRequests: setActivePaginationRequests,
        activeRequests: activePaginationRequests,
      })
      setFetchingMoreTransactions(false)
    },
    [fetchingMoreTransactions],
    {
      onError: (e) => {
        setFetchingMoreTransactions(false)
        dispatch(showError(ErrorMessages.FETCH_FAILED))
        handleError(e)
      },
    }
  )

  useEffect(() => {
    // this hook does 2 things:
    // 1. ensures that we populate the entire screen with transactions on load
    //    so that future refetches can be correctly triggered by `onEndReached`,
    //    in the event that blockchain-api returns a small number of results for
    //    the first page(s)
    // 2. sometimes blockchain-api returns 0 transactions for a page (as we only
    //    display certain transaction types in the app) and for this case,
    //    automatically fetch the next page(s) until some transactions are returned
    //
    // This has the effect of setting the fetchingMoreTransactions flag to true iff
    // - We are not already loading
    // - There exists at least one chain that has further pages
    // - EITHER we do not yet have enough TXs, OR NO chains whatsoever produced results
    //    in the most recent round of fetching (which corresponds to case 2. above
    //    occurring for all chains simultaneously)
    const { transactions, pageInfo, hasTransactionsOnCurrentPage } = fetchedResult
    if (
      !pollNewTransactions.loading &&
      anyNetworkHasMorePages(pageInfo) &&
      (transactions.length < MIN_NUM_TRANSACTIONS ||
        !anyNetworkHasTransactionsOnCurrentPage(hasTransactionsOnCurrentPage))
    ) {
      setFetchingMoreTransactions(true)
    }
  }, [fetchedResult, pollNewTransactions.loading])

  return {
    loading: pollNewTransactions.loading,
    error: pollNewTransactions.error,
    transactions: fetchedResult.transactions,
    fetchingMoreTransactions,
    fetchMoreTransactions: () => {
      if (!fetchedResult.pageInfo) {
        dispatch(showError(ErrorMessages.FETCH_FAILED))
      } else if (
        !anyNetworkHasMorePages(fetchedResult.pageInfo) &&
        fetchedResult.transactions.length > MIN_NUM_TRANSACTIONS
      ) {
        Toast.showWithGravity(t('noMoreTransactions'), Toast.SHORT, Toast.CENTER)
      } else {
        setFetchingMoreTransactions(true)
      }
    },
  }
}

function anyNetworkHasMorePages(pageInfo: { [key in NetworkId]?: PageInfo | null }): boolean {
  return Object.values(pageInfo).some((val) => !!val?.hasNextPage)
}

function anyNetworkHasTransactionsOnCurrentPage(hasTransactionsOnCurrentPage: {
  [key in NetworkId]?: boolean
}): boolean {
  return Object.values(hasTransactionsOnCurrentPage).some((hasTxs) => hasTxs)
}

export function handlePollResponse({
  pageInfo,
  setFetchedResult,
  completedTxHashesByNetwork,
  pendingTxHashesByNetwork,
  pendingStandbyTxHashesByNetwork,
  dispatch,
}: {
  pageInfo: { [key in NetworkId]?: PageInfo | null }
  setFetchedResult: Dispatch<
    SetStateAction<{
      transactions: TokenTransaction[]
      pageInfo: { [key in NetworkId]?: PageInfo | null }
      hasTransactionsOnCurrentPage: { [key in NetworkId]?: boolean }
    }>
  >
  completedTxHashesByNetwork: { [key in NetworkId]?: Set<string> }
  pendingTxHashesByNetwork: { [key in NetworkId]?: Set<string> }
  pendingStandbyTxHashesByNetwork: { [key in NetworkId]?: Set<string> }
  dispatch: AppDispatch
}) {
  return function (networkId: NetworkId, result: QueryResponse | null) {
    const returnedTransactions = result?.data.tokenTransactionsV3?.transactions ?? []
    const returnedPageInfo = result?.data.tokenTransactionsV3?.pageInfo ?? null

    const isInitialFetch = pageInfo[networkId] === null
    if (returnedTransactions.length || returnedPageInfo?.hasNextPage) {
      setFetchedResult((prev) => ({
        transactions: deduplicateTransactions(prev.transactions, returnedTransactions),
        pageInfo: isInitialFetch
          ? { ...prev.pageInfo, [networkId]: returnedPageInfo }
          : prev.pageInfo,
        hasTransactionsOnCurrentPage: isInitialFetch
          ? {
              ...prev.hasTransactionsOnCurrentPage,
              [networkId]: returnedTransactions.length > 0,
            }
          : prev.hasTransactionsOnCurrentPage,
      }))
    }
    if (returnedTransactions.length) {
      // We store the first page in redux to show them to the users when they open the app.
      // Filter out now empty transactions to avoid redux issues
      const nonEmptyTransactions = returnedTransactions.filter(
        (returnedTransaction) => !isEmpty(returnedTransaction)
      )
      const knownCompletedTransactionHashes = completedTxHashesByNetwork[networkId]
      const knownPendingTransactionHashes = pendingTxHashesByNetwork[networkId]
      const pendingStandbyTransactionHashes = pendingStandbyTxHashesByNetwork[networkId]
      let shouldUpdateCachedTransactions = false
      let hasNewCompletedTransaction = false

      // Compare the new tx hashes with the ones we already have in redux
      for (const tx of nonEmptyTransactions) {
        if (tx.status === TransactionStatus.Complete) {
          if (
            !knownCompletedTransactionHashes ||
            !knownCompletedTransactionHashes.has(tx.transactionHash)
          ) {
            shouldUpdateCachedTransactions = true
            hasNewCompletedTransaction = true
          }

          if (
            // Track cross-chain swap transaction status change to `Complete`
            tx.__typename === 'CrossChainTokenExchange' &&
            (pendingStandbyTransactionHashes?.has(tx.transactionHash) ||
              knownPendingTransactionHashes?.has(tx.transactionHash))
          ) {
            trackCrossChainSwapSuccess(tx)
          }
        } else if (tx.status === TransactionStatus.Pending) {
          if (
            !knownPendingTransactionHashes ||
            !knownPendingTransactionHashes.has(tx.transactionHash)
          ) {
            shouldUpdateCachedTransactions = true
          }
        }
      }
      // If there are new transactions update transactions in redux and fetch balances
      if (shouldUpdateCachedTransactions) {
        dispatch(updateTransactions(networkId, nonEmptyTransactions))
      }
      if (hasNewCompletedTransaction) {
        vibrateSuccess()
      }
    }
  }
}
// Queries for transactions feed for any number of networks in parallel,
// with optional pagination support.
async function queryTransactionsFeed({
  address,
  localCurrencyCode,
  params,
  onNetworkResponse,
  setActiveRequests,
  activeRequests,
}: {
  address: string | null
  localCurrencyCode: string
  params: Array<{
    networkId: NetworkId
    afterCursor?: string | null
  }>
  onNetworkResponse: (networkId: NetworkId, data: QueryResponse | null) => void
  setActiveRequests: (updateFunc: (prevState: ActiveRequests) => ActiveRequests) => void
  activeRequests: ActiveRequests
}): Promise<void> {
  // Launch all network requests without waiting for each to finish before starting the next
  const requests = params.map(async ({ networkId, afterCursor }) => {
    // Prevent duplicate requests for the same network
    if (activeRequests[networkId]) {
      Logger.info(TAG, `Skipping fetch for ${networkId} as it is already active`)
      return
    } else {
      Logger.info(TAG, `Fetching transactions for ${networkId} with cursor: ${afterCursor}`)
      setActiveRequests((prev) => ({ ...prev, [networkId]: true }))
    }
    try {
      const result = await queryChainTransactionsFeed({
        address,
        localCurrencyCode,
        networkId,
        afterCursor,
      })
      Logger.info(TAG, `Fetched transactions for ${networkId}`)
      onNetworkResponse(networkId, result) // Update state as soon as data is available
    } finally {
      setActiveRequests((prev) => ({ ...prev, [networkId]: false }))
    }
  })

  await Promise.all(requests) // Wait for all requests to finish for use in useAsync hooks
}

function trackCrossChainSwapSuccess(tx: TokenExchange) {
  const tokensById = tokensByIdSelector(store.getState(), getSupportedNetworkIdsForSwap())

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

async function queryChainTransactionsFeed({
  address,
  localCurrencyCode,
  networkId,
  afterCursor,
}: {
  address: string | null
  localCurrencyCode: string
  networkId: NetworkId
  afterCursor?: string | null
}) {
  Logger.info(`Request to fetch transactions with params:`, {
    address,
    localCurrencyCode,
    afterCursor,
    networkId,
  })

  const response = await fetch(`${config.blockchainApiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: TRANSACTIONS_QUERY,
      variables: {
        address,
        localCurrencyCode,
        networkId: networkId.replaceAll('-', '_'), // GraphQL does not support hyphens in enum values
        afterCursor,
      },
    }),
  })
  const body = (await response.json()) as QueryResponse
  // Augment the transactions with networkId, since this is not included by default
  // from blockchain-api and is needed throughout the app.
  return {
    ...body,
    data: {
      ...body.data,
      tokenTransactionsV3: {
        ...body.data.tokenTransactionsV3,
        transactions:
          body.data.tokenTransactionsV3?.transactions.map((tx) => {
            return { ...tx, networkId }
          }) ?? [],
      },
    },
  }
}

export const TRANSACTIONS_QUERY = gql`
  query UserTransactions(
    $address: Address!
    $localCurrencyCode: String
    $afterCursor: String
    $networkId: NetworkId!
  ) {
    tokenTransactionsV3(
      address: $address
      localCurrencyCode: $localCurrencyCode
      afterCursor: $afterCursor
      networkId: $networkId
    ) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      transactions {
        ...TokenTransferItemV3
        ...NftTransferItemV3
        ...TokenExchangeItemV3
        ...EarnDepositItem
        ...EarnSwapDepositItem
        ...EarnWithdrawItem
        ...EarnClaimRewardItem
        ...TokenApprovalItem
        ...CrossChainTokenExchangeItem
      }
    }
  }

  fragment TokenTransferItemV3 on TokenTransferV3 {
    __typename
    type
    transactionHash
    timestamp
    status
    block
    address
    metadata {
      title
      subtitle
      image
    }
    amount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment NftTransferItemV3 on NftTransferV3 {
    __typename
    type
    transactionHash
    status
    timestamp
    block
    nfts {
      tokenId
      contractAddress
      tokenUri
      ownerAddress
      metadata {
        name
        description
        image
        id
        dna
        date
        attributes {
          trait_type
          value
        }
      }
      media {
        raw
        gateway
      }
    }
  }

  fragment TokenExchangeItemV3 on TokenExchangeV3 {
    __typename
    type
    transactionHash
    status
    timestamp
    block
    metadata {
      title
      subtitle
    }
    inAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    outAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment CrossChainTokenExchangeItem on CrossChainTokenExchange {
    __typename
    type
    transactionHash
    status
    timestamp
    block
    outAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    inAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment EarnSwapDepositItem on EarnSwapDeposit {
    __typename
    type
    transactionHash
    status
    timestamp
    block
    swap {
      inAmount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      outAmount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
    deposit {
      inAmount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      outAmount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      providerId
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment EarnDepositItem on EarnDeposit {
    __typename
    type
    transactionHash
    status
    providerId
    timestamp
    block
    inAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    outAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment EarnWithdrawItem on EarnWithdraw {
    __typename
    type
    transactionHash
    status
    providerId
    timestamp
    block
    inAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    outAmount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment EarnClaimRewardItem on EarnClaimReward {
    __typename
    type
    transactionHash
    status
    providerId
    timestamp
    block
    amount {
      value
      tokenAddress
      tokenId
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment TokenApprovalItem on TokenApproval {
    __typename
    type
    timestamp
    block
    transactionHash
    status
    tokenId
    approvedAmount
    fees {
      type
      amount {
        value
        tokenAddress
        tokenId
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }
`
