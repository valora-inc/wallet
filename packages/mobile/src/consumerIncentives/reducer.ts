import { createSlice } from '@reduxjs/toolkit'

export interface State {
  loading: boolean
  error: boolean
}

export const initialState = {
  loading: false,
  error: false,
}

const slice = createSlice({
  name: 'supercharge',
  initialState,
  reducers: {
    claimRewards: (state) => ({
      ...state,
      loading: true,
      error: false,
    }),
    claimRewardsSuccess: (state) => ({
      ...state,
      loading: false,
      error: false,
    }),
    claimRewardsFailure: (state) => ({
      ...state,
      loading: false,
      error: true,
    }),
  },
})

export const { claimRewards, claimRewardsSuccess, claimRewardsFailure } = slice.actions

export default slice.reducer
