import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { type LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  TokenTransactionTypeV2,
  type PageInfo,
  type TokenTransaction,
} from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

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
      query: ({ address, localCurrencyCode, endCursor }) => {
        const networkIds = Object.values(networkConfig.networkToNetworkId).join('&networkIds[]=')
        const includeTypes = Object.values(TokenTransactionTypeV2).join('&includeTypes[]=')
        const cursor = endCursor === undefined ? '' : `&afterCursor=${endCursor}`
        return `?networkIds[]=${networkIds}&includeTypes[]=${includeTypes}&address=${address}&localCurrencyCode=${localCurrencyCode}${cursor}`
      },
      keepUnusedDataFor: 60, // 1 min
    }),
  }),
})

export const { useTransactionFeedV2Query } = transactionFeedV2Api
