import config from 'src/geth/networkConfig'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { walletAddressSelector } from 'src/web3/selectors'

export async function queryTransactionsFeed(afterCursor?: string) {
  console.log(`DIEGO internal query ${Date.now()}`)
  const address = useSelector(walletAddressSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)

  const response = await fetch(`${config.blockchainApiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: TRANSACTIONS_QUERY,
      variables: { address, localCurrencyCode },
    }),
  })

  console.log(`DIEGO internal query result ${Date.now()}`)
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
