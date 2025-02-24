import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { type LocalCurrencyCode } from 'src/localCurrency/consts'
import { FEED_V2_INCLUDE_TYPES, type PageInfo, type TokenTransaction } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { getSupportedNetworkIds } from 'src/web3/utils'

export type TransactionFeedV2Response = {
  transactions: TokenTransaction[]
  pageInfo: PageInfo
}

const baseQuery = fetchBaseQuery({
  baseUrl: networkConfig.getWalletTransactionsUrl,
  headers: { Accept: 'application/json' },
})

export const transactionFeedV2Api = createApi({
  reducerPath: 'transactionFeedV2Api',
  baseQuery,
  endpoints: (builder) => ({
    transactionFeedV2: builder.query<
      TransactionFeedV2Response,
      {
        address: string
        localCurrencyCode: LocalCurrencyCode
        endCursor: PageInfo['endCursor'] | undefined
      }
    >({
      query: ({ address, localCurrencyCode, endCursor: afterCursor }) => {
        return {
          url: '',
          params: {
            address,
            networkIds: getSupportedNetworkIds().join(','),
            includeTypes: FEED_V2_INCLUDE_TYPES.join(','),
            localCurrencyCode,
            ...(afterCursor && { afterCursor }),
          },
        }
      },
      keepUnusedDataFor: 60, // 1 min
      transformErrorResponse: (error, meta) => {
        if (meta) {
          const params = new URL(meta.request.url).searchParams
          return {
            ...error,
            // only requests for next pages have the afterCursor search param
            hasAfterCursor: params.get('afterCursor'),
          }
        }

        return error
      },
    }),
  }),
})

export const { useTransactionFeedV2Query } = transactionFeedV2Api
