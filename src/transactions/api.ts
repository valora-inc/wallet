import { nanoid } from '@reduxjs/toolkit'
import { createApi, QueryStatus } from '@reduxjs/toolkit/query/react'
import { baseQuery, isRehydrateAction } from 'src/redux/api'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { type RootState } from 'src/redux/store'
import type { TokenTransaction } from 'src/transactions/types'

export const FIRST_PAGE_TIMESTAMP = 0 // placeholder

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
      query: ({ address, endCursor }) => {
        const cursor = endCursor ? `?endCursor=${endCursor}` : ''
        return `/wallet/${address}/transactions${cursor}`
      },
      keepUnusedDataFor: 60, // 1 min
    }),
  }),

  /**
   * Typed "any" as per the docs:
   * https://redux-toolkit.js.org/rtk-query/usage/persistence-and-rehydration#redux-persist
   *
   * Implementation is based on this conversation:
   * https://github.com/reduxjs/redux-toolkit/issues/4334
   */
  extractRehydrationInfo: (action): any => {
    if (isRehydrateAction(action)) {
      const persistedWeb3 = getRehydratePayload(action, 'web3') as RootState['web3'] | undefined
      const walletAddress = persistedWeb3?.account?.toLowerCase() ?? null

      const persistedTransactions = getRehydratePayload(action, 'transactions') as
        | RootState['transactions']
        | undefined
      const feedFirstPage = persistedTransactions?.feedFirstPage || []

      if (walletAddress && feedFirstPage.length) {
        const queryKey = `transactionFeedV2({"address":"${walletAddress}","endCursor":${FIRST_PAGE_TIMESTAMP}})`
        return {
          mutations: {},
          provided: {},
          subscriptions: {},
          queries: {
            [queryKey]: {
              status: QueryStatus.fulfilled,
              endpointName: 'transactionFeedV2',
              requestId: nanoid(),
              originalArgs: { address: walletAddress, endCursor: FIRST_PAGE_TIMESTAMP },
              startedTimeStamp: Date.now(),
              data: { transactions: feedFirstPage },
              fulfilledTimeStamp: Date.now(),
              error: undefined,
            },
          },
          config: {
            online: true,
            focused: true,
            middlewareRegistered: true,
            refetchOnFocus: false,
            refetchOnReconnect: false,
            refetchOnMountOrArgChange: false,
            keepUnusedDataFor: 60,
            reducerPath: 'transactionFeedV2Api',
            invalidationBehavior: 'delayed',
          },
        } satisfies RootState['transactionFeedV2Api']
      }
    }
  },
})

export const { useTransactionFeedV2Query } = transactionFeedV2Api
