import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { SuperchargePendingRewardV2 } from 'src/consumerIncentives/types'
import { getRehydratePayload } from 'src/redux/persist-helper'

export interface State {
  loading: boolean
  error: boolean
  fetchAvailableRewardsLoading: boolean
  fetchAvailableRewardsError: boolean
  superchargeRewardContractAddress: string
  availableRewards: SuperchargePendingRewardV2[]
}

export const initialState: State = {
  loading: false,
  error: false,
  fetchAvailableRewardsLoading: false,
  fetchAvailableRewardsError: false,
  availableRewards: [],
  superchargeRewardContractAddress: '',
}

const slice = createSlice({
  name: 'supercharge',
  initialState,
  reducers: {
    claimRewards: (state, action: PayloadAction<SuperchargePendingRewardV2[]>) => ({
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
    fetchAvailableRewards: (
      state,
      action: PayloadAction<{ forceRefresh: boolean } | undefined>
    ) => ({
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
    setAvailableRewards: (state, action: PayloadAction<SuperchargePendingRewardV2[]>) => ({
      ...state,
      availableRewards: action.payload,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(REHYDRATE, (state, action: RehydrateAction) => ({
        ...state,
        ...getRehydratePayload(action, 'supercharge'),
        loading: false,
        error: false,
        fetchAvailableRewardsLoading: false,
        fetchAvailableRewardsError: false,
        availableRewards: [],
      }))
      .addCase(
        AppActions.UPDATE_REMOTE_CONFIG_VALUES,
        (state, action: UpdateConfigValuesAction) => {
          state.superchargeRewardContractAddress =
            action.configValues.superchargeRewardContractAddress
        }
      )
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
