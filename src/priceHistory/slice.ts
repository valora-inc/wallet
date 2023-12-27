import { Draft, PayloadAction, createSlice } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'

type PriceHistoryStatus = 'loading' | 'success' | 'error'

export interface Price {
  priceUsd: BigNumber.Value
  priceFetchedAt: number
}

export interface State {
  [tokenId: string]: {
    status: PriceHistoryStatus
    prices: Price[]
  }
}

const slice = createSlice({
  name: 'priceHistory',
  initialState: {},
  reducers: {
    fetchPriceHistoryStart: (
      state: Draft<State>,
      action: PayloadAction<{
        tokenId: string
        startTimestamp: number
        endTimestamp: number
      }>
    ) => {
      const { tokenId } = action.payload
      state[tokenId] = {
        ...state[tokenId],
        status: 'loading',
      }
    },
    fetchPriceHistorySuccess: (
      state: Draft<State>,
      action: PayloadAction<{
        tokenId: string
        prices: Price[]
      }>
    ) => {
      const { tokenId, prices } = action.payload
      const token = state[tokenId]
      if (token) {
        token.status = 'success'
        token.prices = prices
      }
    },
    fetchPriceHistoryFailure: (
      state: Draft<State>,
      action: PayloadAction<{
        tokenId: string
      }>
    ) => {
      const { tokenId } = action.payload
      const token = state[tokenId]
      if (token) {
        token.status = 'error'
      }
    },
  },
})

export const { fetchPriceHistoryStart, fetchPriceHistorySuccess, fetchPriceHistoryFailure } =
  slice.actions

export default slice.reducer
