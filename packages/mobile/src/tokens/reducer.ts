import { createAction, createReducer } from '@reduxjs/toolkit'
import { RehydrateAction } from 'redux-persist'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'

export interface Token {
  address: string
  decimals: number
  imageUrl: string
  name: string
  symbol: string
  usdPrice?: number
}

export interface TokenBalance extends Token {
  balance: number | null
}

export interface TokenBalances {
  [address: string]: TokenBalance
}

export interface State {
  tokenBalances: TokenBalances
}

export const initialState = {
  tokenBalances: {},
}

const rehydrate = createAction<any>(REHYDRATE)
export const setTokenBalances = createAction<TokenBalances>('TOKENS/SET_TOKEN_BALANCES')

export const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(rehydrate, (state, action) => {
      // hack to allow rehydrate actions here
      const hydrated = getRehydratePayload((action as unknown) as RehydrateAction, 'tokens')
      return {
        ...state,
        ...hydrated,
      }
    })
    .addCase(setTokenBalances, (state, action) => ({
      ...state,
      tokenBalances: action.payload,
    }))
})
