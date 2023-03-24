import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { SuperchargePendingReward, SuperchargePendingRewardV2 } from 'src/consumerIncentives/types'
import { getRehydratePayload } from 'src/redux/persist-helper'

export interface State {
  loading: boolean
  error: boolean
  fetchAvailableRewardsLoading: boolean
  fetchAvailableRewardsError: boolean
  superchargeRewardContractAddress: string
  availableRewards: SuperchargePendingReward[] | SuperchargePendingRewardV2[]
  superchargeV2Enabled: boolean
  // superchargeV1Addresses can be removed 4 weeks after supercharge V2 is
  // rolled out. it is an array of 24 contract addresses corresponding to the 6
  // token contracts for the last 4 reward distributions in the v1 system. These
  // are the contracts that the user claims their rewards against, we verify the
  // transaction "to" address against this list to ensure the user is signing a
  // safe transaction
  superchargeV1Addresses: string[]
}

export const initialState: State = {
  loading: false,
  error: false,
  fetchAvailableRewardsLoading: false,
  fetchAvailableRewardsError: false,
  availableRewards: [],
  superchargeV2Enabled: false,
  superchargeRewardContractAddress: '',
  superchargeV1Addresses: [],
}

const slice = createSlice({
  name: 'supercharge',
  initialState,
  reducers: {
    claimRewards: (
      state,
      action: PayloadAction<SuperchargePendingReward[] | SuperchargePendingRewardV2[]>
    ) => ({
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
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'supercharge'),
      loading: false,
      error: false,
      fetchAvailableRewardsLoading: false,
      fetchAvailableRewardsError: false,
      availableRewards: [],
    }))
    builder.addCase(
      AppActions.UPDATE_REMOTE_CONFIG_VALUES,
      (state, action: UpdateConfigValuesAction) => {
        state.superchargeV2Enabled = action.configValues.superchargeV2Enabled
        state.superchargeRewardContractAddress =
          action.configValues.superchargeRewardContractAddress
        state.superchargeV1Addresses = action.configValues.superchargeV1Addresses
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
