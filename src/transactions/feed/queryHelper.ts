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
import { fetchTokenBalances } from 'src/tokens/slice'
import { updateTransactions } from 'src/transactions/actions'
import { transactionHashesSelector } from 'src/transactions/reducer'
import { TokenTransaction } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
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
    tokenTransactionsV2: {
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

export function useFetchTransactions(): QueryHookResult {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const transactionHashes = useSelector(transactionHashesSelector)

  // track cumulative transactions and most recent page info in one state, so
  // that they do not become out of sync
  const [fetchedResult, setFetchedResult] = useState<{
    transactions: TokenTransaction[]
    pageInfo: PageInfo | null
    hasTransactionsOnCurrentPage: boolean
  }>({
    transactions: [],
    pageInfo: null,
    hasTransactionsOnCurrentPage: false,
  })
  const [fetchingMoreTransactions, setFetchingMoreTransactions] = useState(false)
  let hasNewTransaction = false

  // Update the counter variable every |POLL_INTERVAL| so that a query is made to the backend.
  const [counter, setCounter] = useState(0)
  useInterval(() => setCounter((n) => n + 1), POLL_INTERVAL)

  const handleResult = (result: QueryResponse, isPollResult: boolean) => {
    Logger.info(TAG, `Fetched ${isPollResult ? 'new' : 'next page of'} transactions`)

    const returnedTransactions = result.data?.tokenTransactionsV2?.transactions ?? []
    const returnedPageInfo = result.data?.tokenTransactionsV2?.pageInfo ?? null
    // the initial feed fetch is from polling, exclude polled updates form that scenario
    const isPolledUpdate = isPollResult && fetchedResult.pageInfo !== null

    if (returnedTransactions?.length || returnedPageInfo?.hasNextPage) {
      setFetchedResult((prev) => ({
        transactions: deduplicateTransactions(prev.transactions, returnedTransactions),
        // avoid updating pageInfo and hasReturnedTransactions for polled
        // updates, as these variables are used for fetching the next pages
        pageInfo: isPolledUpdate ? prev.pageInfo : returnedPageInfo,
        hasTransactionsOnCurrentPage: isPolledUpdate
          ? prev.hasTransactionsOnCurrentPage
          : returnedTransactions.length > 0,
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
      const result = await queryTransactionsFeed(address, localCurrencyCode)
      handleResult(result, true)
    },
    [counter],
    {
      onError: handleError,
    }
  )

  // Query for next page of transaction if requested
  useAsync(
    async () => {
      if (!fetchingMoreTransactions || !fetchedResult.pageInfo?.hasNextPage) {
        setFetchingMoreTransactions(false)
        return
      }

      const result = await queryTransactionsFeed(
        address,
        localCurrencyCode,
        fetchedResult.pageInfo?.endCursor
      )
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
    // this hook does 2 things:
    // 1. ensures that we populate the entire screen with transactions on load
    //    so that future refetches can be correctly triggered by `onEndReached`,
    //    in the event that blockchain-api returns a small number of results for
    //    the first page(s)
    // 2. sometimes blockchain-api returns 0 transactions for a page (as we only
    //    display certain transaction types in the app) and for this case,
    //    automatically fetch the next page(s) until some transactions are returned
    const { transactions, pageInfo, hasTransactionsOnCurrentPage } = fetchedResult
    if (
      !loading &&
      pageInfo?.hasNextPage &&
      (transactions.length < MIN_NUM_TRANSACTIONS || !hasTransactionsOnCurrentPage)
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
        !fetchedResult.pageInfo?.hasNextPage &&
        fetchedResult.transactions.length > MIN_NUM_TRANSACTIONS
      ) {
        Toast.showWithGravity(t('noMoreTransactions'), Toast.SHORT, Toast.CENTER)
      } else {
        setFetchingMoreTransactions(true)
      }
    },
  }
}

async function queryTransactionsFeed(
  address: string | null,
  localCurrencyCode: string,
  afterCursor?: string
) {
  Logger.info(
    `Request to fetch transactions with params: ${JSON.stringify({
      address,
      localCurrencyCode,
      afterCursor,
    })}`
  )
  const response = await fetch(`${config.blockchainApiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: TRANSACTIONS_QUERY,
      variables: { address, localCurrencyCode, afterCursor },
    }),
  })
  return response.json()
}

export const TRANSACTIONS_QUERY = `
  query UserTransactions($address: Address!, $localCurrencyCode: String, $afterCursor: String) {
    tokenTransactionsV2(address: $address, localCurrencyCode: $localCurrencyCode, afterCursor: $afterCursor) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      transactions {
        ...TokenTransferItemV2
        ...NftTransferItemV2
        ...TokenExchangeItemV2
      } 
    }
  }

  fragment TokenTransferItemV2 on TokenTransferV2 {
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

  fragment NftTransferItemV2 on NftTransferV2 {
    __typename
    type
    transactionHash
    timestamp
    block
  }

  fragment TokenExchangeItemV2 on TokenExchangeV2 {
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
