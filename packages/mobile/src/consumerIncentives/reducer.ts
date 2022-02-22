import { createAction, createReducer } from '@reduxjs/toolkit'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'

export interface State {
  loading: boolean
  error: boolean
}

export const initialState = {
  loading: false,
  error: false,
}

export const claimRewards = createAction<SuperchargePendingReward[]>('SUPERCHARGE/CLAIM_REWARDS')
export const claimRewardsSuccess = createAction('SUPERCHARGE/CLAIM_REWARDS_SUCCESS')
export const claimRewardsFailure = createAction('SUPERCHARGE/CLAIM_REWARDS_FAILURE')

export const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(claimRewards, (state) => ({
      ...state,
      loading: true,
      error: false,
    }))
    .addCase(claimRewardsSuccess, (state) => ({
      ...state,
      loading: false,
      error: false,
    }))
    .addCase(claimRewardsFailure, (state) => ({
      ...state,
      loading: false,
      error: true,
    }))
})
