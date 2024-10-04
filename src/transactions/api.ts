import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { REHYDRATE } from 'redux-persist'
import { type Action } from 'redux-saga'
import { RootState } from 'src/redux/reducers'
import { type TokenTransaction } from 'src/transactions/types'

type FeedResponse = {
  transactions: TokenTransaction[]
  pageInfo: {
    hasNextPage: boolean
  }
}

function isRehydrateAction(action: Action): action is Action<typeof REHYDRATE> & {
  key: string
  payload: RootState
  err: unknown
} {
  return action.type === REHYDRATE
}

export const transactionFeedV2Api = createApi({
  reducerPath: 'transactionFeedV2Api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/wallet/',
    headers: {
      Accept: 'application/json',
    },
  }),
  endpoints: (builder) => ({
    transactionFeedV2: builder.query<FeedResponse, { address: string; endCursor: number }>({
      query: ({ address, endCursor }) => `${address}/transactions?endCursor=${endCursor}`,
    }),
  }),
  extractRehydrationInfo: (action, { reducerPath }): any => {
    if (isRehydrateAction(action)) {
      return action.payload[reducerPath]
    }
  },
})

const { useTransactionFeedV2Query } = transactionFeedV2Api
export { useTransactionFeedV2Query }
