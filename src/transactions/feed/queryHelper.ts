import { isEmpty } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-simple-toast'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import useInterval from 'src/hooks/useInterval'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getMultichainFeatures } from 'src/statsig/index'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { updateTransactions } from 'src/transactions/actions'
import { transactionHashesByNetworkIdSelector } from 'src/transactions/reducer'
import { NetworkId, TokenTransaction, TransactionStatus } from 'src/transactions/types'
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
  startCursor: string
  endCursor: string
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

  return Object.values(transactionsByTxHash).sort((a, b) => {
    return b.timestamp - a.timestamp
  })
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
  const transactionHashesByNetwork = useSelector(transactionHashesByNetworkIdSelector)
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
    transactions: [],
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

  // Update the counter variable every |POLL_INTERVAL| so that a query is made to the backend.
  const [counter, setCounter] = useState(0)
  useInterval(() => setCounter((n) => n + 1), POLL_INTERVAL)

  const handleError = (error: Error) => {
    Logger.error(TAG, 'Error while fetching transactions', error)
  }

  // Query for new transaction every POLL_INTERVAL
  const { loading, error } = useAsync(
    async () => {
      await queryTransactionsFeed({
        address,
        localCurrencyCode,
        params: allowedNetworkIds.map((networkId) => {
          return { networkId }
        }),
        onNetworkResponse: (networkId, result) => {
          const returnedTransactions = result?.data.tokenTransactionsV3?.transactions ?? []
          const returnedPageInfo = result?.data.tokenTransactionsV3?.pageInfo ?? null

          // During the initial feed fetch we need to perform some first time setup
          const isInitialFetch = fetchedResult.pageInfo[networkId] === null
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
            const knownTransactionHashes = transactionHashesByNetwork[networkId]
            let hasNewTransaction = false
            let hasNewCompletedTransaction = false

            // Compare the new tx hashes with the ones we already have in redux
            for (const tx of nonEmptyTransactions) {
              if (!knownTransactionHashes || !knownTransactionHashes.has(tx.transactionHash)) {
                hasNewTransaction = true
                if (tx.status === TransactionStatus.Complete) {
                  hasNewCompletedTransaction = true
                }
              }
            }
            // If there are new transactions update transactions in redux and fetch balances
            if (hasNewTransaction) {
              dispatch(updateTransactions(networkId, nonEmptyTransactions))
            }
            if (hasNewCompletedTransaction) {
              // only add haptic feedback on receiving new completed
              // transactions, since pending transactions can be received for
              // cross-chain swaps.
              vibrateSuccess()
            }
          }
        },
        setActiveRequests: setActivePollingRequests,
        activeRequests: activePollingRequests,
      })
    },
    [counter],
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
        afterCursor?: string
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
      !loading &&
      anyNetworkHasMorePages(pageInfo) &&
      (transactions.length < MIN_NUM_TRANSACTIONS ||
        !anyNetworkHasTransactionsOnCurrentPage(hasTransactionsOnCurrentPage))
    ) {
      setFetchingMoreTransactions(true)
    }
  }, [fetchedResult, loading])

  return {
    loading,
    error,
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
    afterCursor?: string
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
      Logger.info(TAG, `Fetched transactions for ${networkId}`, result)
      onNetworkResponse(networkId, result) // Update state as soon as data is available
    } finally {
      setActiveRequests((prev) => ({ ...prev, [networkId]: false }))
    }
  })

  await Promise.all(requests) // Wait for all requests to finish for use in useAsync hooks
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
  afterCursor?: string
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
      comment
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
