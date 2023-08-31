import { isEmpty } from 'lodash'
import { useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-simple-toast'
import { batch, useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import useInterval from 'src/hooks/useInterval'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { fetchTokenBalances } from 'src/tokens/slice'
import { updateTransactions } from 'src/transactions/actions'
import { transactionHashesSelector } from 'src/transactions/reducer'
import { TokenTransaction, Network } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import config from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { getFeatureGate } from 'src/statsig/index'
import { StatsigFeatureGates } from 'src/statsig/types'

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

const TAG = 'transactions/feed/queryHelper'

// Query poll interval
const POLL_INTERVAL = 10000 // 10 secs

const deduplicateTransactions = (
  existingTxs: TokenTransaction[],
  incomingTxs: TokenTransaction[]
) => {
  const currentHashes = new Set(existingTxs.map((tx) => tx.transactionHash))
  const transactionsWithoutDuplicatedHash = existingTxs.concat(
    incomingTxs.filter((tx) => !isEmpty(tx) && !currentHashes.has(tx.transactionHash))
  )
  transactionsWithoutDuplicatedHash.sort((a, b) => {
    return b.timestamp - a.timestamp
  })
  return transactionsWithoutDuplicatedHash
}

export function getAllowedNetworks(): Array<Network> {
  return getFeatureGate(StatsigFeatureGates.SHOW_MULTI_CHAIN_TRANSFERS)
    ? Object.values(Network)
    : [Network.Celo]
}

export function useFetchTransactions(): QueryHookResult {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const transactionHashes = useSelector(transactionHashesSelector)

  // N.B: This fetch-time filtering does not suffice to prevent non-Celo TXs from appearing
  // on the home feed, since they get cached in Redux -- this is just a network optimization.
  const allowedNetworks = getAllowedNetworks()

  // Track cumulative transactions and most recent page info for all chains in one
  // piece of state so that they don't become out of sync.
  const [fetchedResult, setFetchedResult] = useState<{
    transactions: TokenTransaction[]
    pageInfo: { [key in Network]?: PageInfo | null }
    hasTransactionsOnCurrentPage: { [key in Network]?: boolean }
  }>({
    transactions: [],
    pageInfo: allowedNetworks.reduce((acc, cur) => {
      return {
        ...acc,
        [cur]: null,
      }
    }, {}),
    hasTransactionsOnCurrentPage: allowedNetworks.reduce((acc, cur) => {
      return {
        ...acc,
        [cur]: false,
      }
    }, {}),
  })

  const [fetchingMoreTransactions, setFetchingMoreTransactions] = useState(false)
  let hasNewTransaction = false

  // Update the counter variable every |POLL_INTERVAL| so that a query is made to the backend.
  const [counter, setCounter] = useState(0)
  useInterval(() => setCounter((n) => n + 1), POLL_INTERVAL)

  const handleResult = (results: { [key in Network]?: QueryResponse }, isPollResult: boolean) => {
    Logger.info(TAG, `Fetched ${isPollResult ? 'new' : 'next page of'} transactions`)

    for (const [network, result] of Object.entries(results) as Array<[Network, QueryResponse]>) {
      const returnedTransactions = result.data?.tokenTransactionsV3?.transactions ?? []

      const returnedPageInfo = result.data?.tokenTransactionsV3?.pageInfo ?? null

      // the initial feed fetch is from polling, exclude polled updates from that scenario
      const isPolledUpdate = isPollResult && fetchedResult.pageInfo[network] !== null

      if (returnedTransactions?.length || returnedPageInfo?.hasNextPage) {
        setFetchedResult((prev) => ({
          transactions: deduplicateTransactions(prev.transactions, returnedTransactions),
          // avoid updating pageInfo and hasReturnedTransactions for polled
          // updates, as these variables are used for fetching the next pages
          pageInfo: isPolledUpdate
            ? prev.pageInfo
            : { ...prev.pageInfo, [network]: returnedPageInfo },
          hasTransactionsOnCurrentPage: isPolledUpdate
            ? prev.hasTransactionsOnCurrentPage
            : { ...prev.hasTransactionsOnCurrentPage, [network]: returnedTransactions.length > 0 },
        }))

        if (isPollResult && returnedTransactions.length) {
          // We store the first page in redux to show them to the users when they open the app.
          // Filter out now empty transactions to avoid redux issues
          const nonEmptyTransactions = returnedTransactions.filter(
            (returnedTransaction) => !isEmpty(returnedTransaction)
          )
          // Compare the new tx hashes with the ones we already have in redux
          for (let i = 0; i < nonEmptyTransactions.length; i++) {
            if (!transactionHashes.includes(nonEmptyTransactions[i].transactionHash)) {
              hasNewTransaction = true
              break // We only need one new tx justify a refresh
            }
          }
          // If there are new transactions update transactions in redux and fetch balances
          if (hasNewTransaction) {
            batch(() => {
              dispatch(updateTransactions(nonEmptyTransactions))
              dispatch(fetchTokenBalances({ showLoading: false }))
            })
            vibrateSuccess()
          }
        }
      }
    }
  }

  const handleError = (error: Error) => {
    Logger.error(TAG, 'Error while fetching transactions', error)
  }

  // Query for new transaction every POLL_INTERVAL
  const { loading, error } = useAsync(
    async () => {
      const result = await queryTransactionsFeed({
        address,
        localCurrencyCode,
        params: allowedNetworks.map((network) => {
          return { network }
        }),
      })
      handleResult(result, true)
    },
    [counter],
    {
      onError: handleError,
    }
  )

  // Query for more transactions if requested
  useAsync(
    async () => {
      if (!fetchingMoreTransactions || !anyNetworkHasMorePages(fetchedResult.pageInfo)) {
        setFetchingMoreTransactions(false)
        return
      }
      // If we're requested to fetch more transactions, only fetch them for networks
      // that actually have further pages.
      const params: Array<{
        network: Network
        afterCursor?: string
      }> = (Object.entries(fetchedResult.pageInfo) as Array<[Network, PageInfo | null]>)
        .map(([network, pageInfo]) => {
          return { network, afterCursor: pageInfo?.endCursor }
        })
        .filter((networkParams) => fetchedResult.pageInfo[networkParams.network]?.hasNextPage)
      const result = await queryTransactionsFeed({
        address,
        localCurrencyCode,
        params,
      })
      setFetchingMoreTransactions(false)
      handleResult(result, false)
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
    // this hook does 2 1:
    // things. ensures that we populate the entire screen with transactions on load
    //    so that future refetches can be correctly triggered by `onEndReached`,
    //    in the event that blockchain-api returns a small number of results for
    //    the first page(s)
    // 2. sometimes blockchain-api returns 0 transactions for a page (as we only
    //    display certain transaction types in the app) and for this case,
    //    automatically fetch the next page(s) until some transactions are returned
    //
    // This has the effect of setting the fetchingMoreTransactions flag to true iff
    // - We are not already loading
    // - There exists at least one chain that has futher pages
    // - EITHER we do not yet have enough TXs, OR NO chains whatsoever produced results
    //    in the most recent round of fetching (which corresponds to case 2. above
    //    occuring for all chains simaltaneously)
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

function anyNetworkHasMorePages(pageInfo: { [key in Network]?: PageInfo | null }): boolean {
  return Object.values(pageInfo).some((val) => !!val?.hasNextPage)
}

function anyNetworkHasTransactionsOnCurrentPage(hasTransactionsOnCurrentPage: {
  [key in Network]?: boolean
}): boolean {
  return Object.values(hasTransactionsOnCurrentPage).some((hasTxs) => hasTxs)
}

// Queries for transactions feed for any number of networks in parallel,
// with optional pagination support.
async function queryTransactionsFeed({
  address,
  localCurrencyCode,
  params,
}: {
  address: string | null
  localCurrencyCode: string
  params: Array<{
    network: Network
    afterCursor?: string
  }>
}): Promise<{ [key in Network]?: QueryResponse }> {
  const results = await Promise.all(
    params.map(({ network, afterCursor }) =>
      queryChainTransactionsFeed({
        address,
        localCurrencyCode,
        network,
        afterCursor,
      })
    )
  )

  return results.reduce((acc, result, index) => {
    return {
      ...acc,
      [params[index].network]: result,
    }
  }, {})
}

async function queryChainTransactionsFeed({
  address,
  localCurrencyCode,
  network,
  afterCursor,
}: {
  address: string | null
  localCurrencyCode: string
  network: Network
  afterCursor?: string
}) {
  Logger.info(`Request to fetch transactions with params:`, {
    address,
    localCurrencyCode,
    afterCursor,
    network,
  })

  const response = await fetch(`${config.blockchainApiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: TRANSACTIONS_QUERY,
      variables: { address, localCurrencyCode, network, afterCursor },
    }),
  })
  const body = (await response.json()) as QueryResponse
  // Augment the transactions with chain data, since this is not included by default
  // from blockchain-api and is needed throughout the app.
  return {
    ...body,
    data: {
      ...body.data,
      tokenTransactionsV3: {
        ...body.data.tokenTransactionsV3,
        transactions: body.data.tokenTransactionsV3.transactions.map((tx) => {
          return { ...tx, network }
        }),
      },
    },
  }
}

export const TRANSACTIONS_QUERY = `
  query UserTransactions($address: Address!, $localCurrencyCode: String, $afterCursor: String, $network: Network!) {
    tokenTransactionsV3(address: $address, localCurrencyCode: $localCurrencyCode, afterCursor: $afterCursor, network: $network) {
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
      }
    }
  }

  fragment TokenTransferItemV3 on TokenTransferV3 {
    __typename
    type
    transactionHash
    timestamp
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
    timestamp
    block
    fees {
      type
      amount {
        value
        tokenAddress
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }

  fragment TokenExchangeItemV3 on TokenExchangeV3 {
    __typename
    type
    transactionHash
    timestamp
    block
    metadata {
      title
      subtitle
    }
    inAmount {
      value
      tokenAddress
      localAmount {
        value
        currencyCode
        exchangeRate
      }
    }
    outAmount {
      value
      tokenAddress
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
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  }
`
