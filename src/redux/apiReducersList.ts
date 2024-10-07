import { transactionFeedV2Api } from 'src/transactions/api'

export const apiReducersList = {
  [transactionFeedV2Api.reducerPath]: transactionFeedV2Api.reducer,
} as const

export type ApiReducersKeys = keyof typeof apiReducersList
