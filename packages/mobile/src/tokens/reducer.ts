import { createAction, createReducer } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import { RehydrateAction } from 'redux-persist'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

interface BaseToken {
  address: string
  decimals: number
  imageUrl: string
  name: string
  symbol: string
}

// Stored variant stores numbers as strings because BigNumber is not serializable.
export interface StoredTokenBalance extends BaseToken {
  balance?: string | null
  usdPrice?: string
}

export interface TokenBalance extends BaseToken {
  balance: BigNumber | null
  usdPrice?: BigNumber
}

export interface StoredTokenBalances {
  [address: string]: StoredTokenBalance | undefined
}

export interface TokenBalances {
  [address: string]: TokenBalance | undefined
}

export interface State {
  tokenBalances: StoredTokenBalances
}

export const initialState = {
  tokenBalances: {},
}

const rehydrate = createAction<any>(REHYDRATE)
export const setTokenBalances = createAction<StoredTokenBalances>('TOKENS/SET_TOKEN_BALANCES')

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

export const tokenBalancesSelector = (state: RootState) => state.tokens.tokenBalances
