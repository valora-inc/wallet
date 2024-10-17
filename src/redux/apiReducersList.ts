import { transactionFeedV2Api } from 'src/transactions/api'

export type ApiReducersKeys = keyof typeof apiReducersList

export const apiReducersList = {
  [transactionFeedV2Api.reducerPath]: transactionFeedV2Api.reducer,
} as const

export const apiMiddlewares = [transactionFeedV2Api.middleware]

export const apiReducersKeys = Object.keys(apiReducersList)
