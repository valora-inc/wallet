import { createAction, createReducer } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import { RehydrateAction } from 'redux-persist'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'

export interface BaseToken {
  address: string
  decimals: number
  imageUrl: string
  name: string
  symbol: string
  priceFetchedAt?: number
  // This field is for tokens that are part of the core contracts that allow paying for fees and
  // making transfers with a comment.
  isCoreToken?: boolean
}

export type UbeswapExprimentalToken = Omit<
  BaseToken,
  'imageUrl' | 'priceFetchedAt' | 'isCoreToken'
> & {
  logoURI: string
}

interface HistoricalUsdPrices {
  lastDay: {
    price: BigNumber.Value
    at: number
  }
}

// Stored variant stores numbers as strings because BigNumber is not serializable.
export interface StoredTokenBalance extends BaseToken {
  balance: string | null
  usdPrice: string
  historicalUsdPrices?: HistoricalUsdPrices
}

export interface TokenBalance extends BaseToken {
  balance: BigNumber
  usdPrice: BigNumber | null
  historicalUsdPrices?: HistoricalUsdPrices
}

export interface BaseTokens {
  [address: string]: UbeswapExprimentalToken
}

export interface StoredTokenBalances {
  [address: string]: StoredTokenBalance | undefined
}

export interface TokenBalances {
  [address: string]: TokenBalance | undefined
}

export interface State {
  tokenBalances: StoredTokenBalances
  loading: boolean
  error: boolean
}

export const initialState = {
  tokenBalances: {},
  loading: false,
  error: false,
}

const rehydrate = createAction<any>(REHYDRATE)
export const setTokenBalances = createAction<StoredTokenBalances>('TOKENS/SET_TOKEN_BALANCES')
export const fetchTokenBalances = createAction('TOKENS/FETCH_TOKEN_BALANCES')
export const tokenBalanceFetchError = createAction('TOKENS/TOKEN_BALANCES_FETCH_ERROR')

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
      loading: false,
      error: false,
    }))
    .addCase(fetchTokenBalances, (state, action) => ({
      ...state,
      loading: true,
      error: false,
    }))
    .addCase(tokenBalanceFetchError, (state, action) => ({
      ...state,
      loading: false,
      error: true,
    }))
})
