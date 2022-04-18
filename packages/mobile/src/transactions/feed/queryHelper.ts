import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { showError, showMessage } from 'src/alert/actions'
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
interface QueryResponse {
  data: {
    tokenTransactionsV2: {
      __typename: 'TokenTransactionsV2'
      transactions: TokenTransaction[]
      pageInfo: PageInfo
    }
  }
}

const TAG = 'transactions/feed/queryHelper'

// Query poll interval
const POLL_INTERVAL = 10000 // 10 secs

function addDeduplicatedTransactions(
  fetchedTransactions: TokenTransaction[],
  setFetchedTransactions: (txs: TokenTransaction[]) => void
) {
  return (transactions: TokenTransaction[]) => {
    const currentHashes = new Set(fetchedTransactions.map((tx) => tx.transactionHash))

    const transactionsWithoutDuplicatedHash = fetchedTransactions.concat(
      transactions.filter((tx) => !currentHashes.has(tx.transactionHash))
    )

    transactionsWithoutDuplicatedHash.sort((a, b) => {
      return b.timestamp - a.timestamp
    })

    setFetchedTransactions(transactionsWithoutDuplicatedHash)
  }
}

export function useFetchTransactions(): QueryHookResult {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)

  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [fetchingMoreTransactions, setFetchingMoreTransactions] = useState(false)
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])

  // Update the counter variable every |POLL_INTERVAL| so that a query is made to the backend.
  const [counter, setCounter] = useState(0)
  useInterval(() => setCounter((n) => n + 1), POLL_INTERVAL)

  const addTransactions = addDeduplicatedTransactions(transactions, setTransactions)

  const handleResult = (result: QueryResponse, paginatedResult: boolean) => {
    Logger.info(TAG, `Fetched ${paginatedResult ? 'next page' : 'new'} transactions`)

    if (result?.data?.tokenTransactionsV2?.transactions.length) {
      addTransactions(result.data.tokenTransactionsV2.transactions)
      if (!paginatedResult) {
        dispatch(updateTransactions(result.data.tokenTransactionsV2.transactions))
      }
    }
    if (!pageInfo || paginatedResult) {
      setPageInfo(result?.data?.tokenTransactionsV2?.pageInfo)
    }
  }

  const handleError = (error: Error) => {
    dispatch(showError(ErrorMessages.FETCH_FAILED))
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
        dispatch(showMessage(t('noMoreTransactions')))
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
