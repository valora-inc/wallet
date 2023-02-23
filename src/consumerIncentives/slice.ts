import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { SuperchargePendingReward, SuperchargePendingRewardV2 } from 'src/consumerIncentives/types'

export interface State {
  loading: boolean
  error: boolean
  fetchAvailableRewardsLoading: boolean
  fetchAvailableRewardsError: boolean
  superchargeRewardContractAddress: string
  availableRewards: SuperchargePendingReward[] | SuperchargePendingRewardV2[]
  superchargeV2Enabled: boolean
}

export const initialState: State = {
  loading: false,
  error: false,
  fetchAvailableRewardsLoading: false,
  fetchAvailableRewardsError: false,
  availableRewards: [],
  superchargeV2Enabled: false,
  superchargeRewardContractAddress: '',
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
    setAvailableRewards: (
      state,
      action: PayloadAction<SuperchargePendingReward[] | SuperchargePendingRewardV2[]>
    ) => ({
      ...state,
      availableRewards: action.payload,
    }),
  },
  extraReducers: (builder) => {
    builder.addCase(
      AppActions.UPDATE_REMOTE_CONFIG_VALUES,
      (state, action: UpdateConfigValuesAction) => {
        state.superchargeV2Enabled = action.configValues.superchargeV2Enabled
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
