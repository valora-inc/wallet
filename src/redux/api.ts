import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { REHYDRATE } from 'redux-persist'
import type { Action } from 'redux-saga'
import type { RootState } from 'src/redux/reducers'
import networkConfig from 'src/web3/networkConfig'

export const baseQuery = fetchBaseQuery({
  baseUrl: networkConfig.blockchainApiUrl,
  headers: {
    Accept: 'application/json',
  },
})

function isRehydrateAction(action: Action): action is Action<typeof REHYDRATE> & {
  key: string
  payload: RootState
  err: unknown
} {
  return action.type === REHYDRATE
}
