import { useAsync } from 'react-async-hook'
import config from 'src/geth/networkConfig'

export interface QueryParams {
  address: string | null
  localCurrencyCode: string
  afterCursor?: string
  dependencies: any[]
  onSuccess: (result: any) => void
  onError: (error: Error) => void
  precondition?: () => boolean
}

export function useAsyncQueryTransactionsFeed(params: QueryParams) {
  const {
    address,
    localCurrencyCode,
    afterCursor,
    dependencies,
    onSuccess,
    onError,
    precondition,
  } = params

  return useAsync(
    async () => {
      if (precondition && !precondition()) {
        // If a precondition is present and it's not met, we avoid the request and return null
        return null
      }
      return await queryTransactionsFeed(address, localCurrencyCode, afterCursor)
    },
    dependencies,
    {
      onSuccess,
      onError,
    }
  )
}

async function queryTransactionsFeed(
  address: string | null,
  localCurrencyCode: string,
  afterCursor?: string
) {
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
