import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'

export interface State {
  loading: boolean
  error: boolean
  availableRewards: SuperchargePendingReward[]
  fetchAvailableRewardsLoading: boolean
  fetchAvailableRewardsError: boolean
}

export const initialState: State = {
  loading: false,
  error: false,
  fetchAvailableRewardsLoading: false,
  fetchAvailableRewardsError: false,
  availableRewards: [],
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
    fetchAvailableRewards: (state) => ({
      ...state,
      fetchAvailableRewardsLoading: true,
      fetchAvailableRewardsError: false,
    }),
    fetchAvailableRewardsSuccess: (state) => ({
      ...state,
      fetchAvailableRewardsLoading: false,
      fetchAvailableRewardsError: false,
    }),
    fetchAvailableRewardsFailure: (state) => ({
      ...state,
      fetchAvailableRewardsLoading: false,
      fetchAvailableRewardsError: true,
    }),
    setAvailableRewards: (state, action: PayloadAction<SuperchargePendingReward[]>) => ({
      ...state,
      availableRewards: action.payload,
    }),
  },
})

export const {
  claimRewards,
  claimRewardsSuccess,
  claimRewardsFailure,
  fetchAvailableRewards,
  fetchAvailableRewardsSuccess,
  fetchAvailableRewardsFailure,
  setAvailableRewards,
} = slice.actions

export default slice.reducer
