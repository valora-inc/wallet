import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'

interface BaseToken {
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

export interface HistoricalUsdPrices {
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
  lastKnownUsdPrice: BigNumber | null
  historicalUsdPrices?: HistoricalUsdPrices
}

export interface StoredTokenBalances {
  [address: string]: StoredTokenBalance | undefined
}

export interface TokenLoadingAction {
  showLoading: boolean
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

const slice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    setTokenBalances: (state, action: PayloadAction<StoredTokenBalances>) => ({
      ...state,
      tokenBalances: action.payload,
      loading: false,
      error: false,
    }),
    fetchTokenBalances: (state, action: PayloadAction<TokenLoadingAction>) => ({
      ...state,
      loading: action.payload.showLoading,
      error: false,
    }),
    fetchTokenBalancesSuccess: (state) => ({
      ...state,
      loading: false,
      error: false,
    }),
    fetchTokenBalancesFailure: (state) => ({
      ...state,
      loading: false,
      error: true,
    }),
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'tokens'),
    }))
  },
})

export const {
  setTokenBalances,
  fetchTokenBalances,
  fetchTokenBalancesSuccess,
  fetchTokenBalancesFailure,
} = slice.actions

export default slice.reducer
