import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery, isRehydrateAction } from 'src/redux/api'
import type { TokenTransaction } from 'src/transactions/types'

export type TransactionFeedV2Response = {
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
  extractRehydrationInfo: (action, { reducerPath }): any => {
    if (isRehydrateAction(action)) {
      /**
       * Even though payload is types as RootState - redux-persist can evaluate it as undefined.
       */
      return action.payload?.[reducerPath]
    }
  },
})

export const { useTransactionFeedV2Query } = transactionFeedV2Api
