import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-simple-toast'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import config from 'src/geth/networkConfig'
import useInterval from 'src/hooks/useInterval'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { updateTransactions } from 'src/transactions/actions'
import { TokenTransaction } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

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

function useDeduplicatedTransactions() {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const addTransactions = (newTransactions: TokenTransaction[]) => {
    const currentHashes = new Set(transactions.map((tx) => tx.transactionHash))
    const transactionsWithoutDuplicatedHash = transactions.concat(
      newTransactions.filter((tx) => !currentHashes.has(tx.transactionHash))
    )
    transactionsWithoutDuplicatedHash.sort((a, b) => {
      return b.timestamp - a.timestamp
    })
    setTransactions(transactionsWithoutDuplicatedHash)
  }

  return {
    transactions,
    addTransactions,
  }
}

export function useFetchTransactions(): QueryHookResult {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)

  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [fetchingMoreTransactions, setFetchingMoreTransactions] = useState(false)
  const { transactions, addTransactions } = useDeduplicatedTransactions()

  // Update the counter variable every |POLL_INTERVAL| so that a query is made to the backend.
  const [counter, setCounter] = useState(0)
  useInterval(() => setCounter((n) => n + 1), POLL_INTERVAL)

  const handleResult = (result: QueryResponse, paginatedResult: boolean) => {
    Logger.info(TAG, `Fetched ${paginatedResult ? 'next page' : 'new'} transactions`)

    const returnedTransactions = result.data?.tokenTransactionsV2?.transactions
    if (returnedTransactions?.length) {
      addTransactions(returnedTransactions)
      // We store non-paginated results in redux to show them to the users when they open the app.
      if (!paginatedResult) {
        dispatch(updateTransactions(returnedTransactions))
      }
    }

    const returnedPageInfo = result.data?.tokenTransactionsV2?.pageInfo
    if ((!pageInfo || paginatedResult) && returnedPageInfo) {
      setPageInfo(returnedPageInfo)
    }
  }

  const handleError = (error: Error) => {
    Logger.error(TAG, 'Error while fetching transactions', error)
  }

  // Query for new transaction every POLL_INTERVAL
  const { loading, error } = useAsync(
    async () => {
      const result = await queryTransactionsFeed(address, localCurrencyCode)
      handleResult(result, false)
    },
    [counter],
    {
      onError: handleError,
    }
  )

  // Query for next page of transaction if requested
  useAsync(
    async () => {
      if (!fetchingMoreTransactions || !pageInfo?.hasNextPage) {
        setFetchingMoreTransactions(false)
        return
      }

      const result = await queryTransactionsFeed(address, localCurrencyCode, pageInfo?.endCursor)
      setFetchingMoreTransactions(false)
      handleResult(result, true)
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

  return {
    loading,
    error,
    transactions,
    fetchingMoreTransactions,
    fetchMoreTransactions: () => {
      if (!pageInfo) {
        dispatch(showError(ErrorMessages.FETCH_FAILED))
      } else if (!pageInfo.hasNextPage) {
        // If the user has a few transactions, don't show any message
        if (transactions.length > 20) {
          Toast.showWithGravity(t('noMoreTransactions'), Toast.SHORT, Toast.CENTER)
        }
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
