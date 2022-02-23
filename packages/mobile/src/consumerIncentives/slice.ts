import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'

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
    claimRewards: (state, action: PayloadAction<SuperchargePendingReward[]>) => ({
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
