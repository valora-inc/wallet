import { type Action } from '@reduxjs/toolkit'
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { REHYDRATE, type RehydrateAction } from 'redux-persist'
import networkConfig from 'src/web3/networkConfig'

export const baseQuery = fetchBaseQuery({
  baseUrl: networkConfig.blockchainApiUrl,
  headers: {
    Accept: 'application/json',
  },
})

export function isRehydrateAction(action: Action): action is RehydrateAction {
  return action.type === REHYDRATE
}
