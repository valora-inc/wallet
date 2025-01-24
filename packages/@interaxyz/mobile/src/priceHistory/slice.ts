import { Draft, PayloadAction, createSlice } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'

export type PriceHistoryStatus = 'loading' | 'success' | 'error'

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
  initialState: {} as State,
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
      state[tokenId] = {
        ...state[tokenId],
        status: 'success',
        prices,
      }
    },
    fetchPriceHistoryFailure: (
      state: Draft<State>,
      action: PayloadAction<{
        tokenId: string
      }>
    ) => {
      const { tokenId } = action.payload
      state[tokenId] = {
        ...state[tokenId],
        status: 'error',
      }
    },
  },
})

export const { fetchPriceHistoryStart, fetchPriceHistorySuccess, fetchPriceHistoryFailure } =
  slice.actions

export default slice.reducer
