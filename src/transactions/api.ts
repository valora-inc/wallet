import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from 'src/redux/api'
import type { TokenTransaction } from 'src/transactions/types'

type TransactionFeedV2Response = {
  transactions: TokenTransaction[]
  pageInfo: {
    hasNextPage: boolean
  }
}

export const transactionFeedV2Api = createApi({
  reducerPath: 'transactionFeedV2Api',
  baseQuery,
  endpoints: (builder) => ({
    transactionFeedV2: builder.query<
      TransactionFeedV2Response,
      { address: string; endCursor: number }
    >({
      query: ({ address, endCursor }) => `/wallet/${address}/transactions?endCursor=${endCursor}`,
    }),
  }),
})
