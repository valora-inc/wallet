import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { DepositInfo, PoolInfo, WithdrawInfo } from 'src/earn/types'
import { getRehydratePayload } from 'src/redux/persist-helper'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface State {
  depositStatus: Status
  withdrawStatus: Status
  poolInfoFetchStatus: Status
  poolInfo?: PoolInfo
}

const initialState: State = {
  depositStatus: 'idle',
  withdrawStatus: 'idle',
  poolInfoFetchStatus: 'idle',
}

export const slice = createSlice({
  name: 'earn',
  initialState,
  reducers: {
    depositStart: (state, action: PayloadAction<DepositInfo>) => {
      state.depositStatus = 'loading'
    },
    depositSuccess: (state) => {
      state.depositStatus = 'success'
    },
    depositError: (state) => {
      state.depositStatus = 'error'
    },
    depositCancel: (state) => {
      state.depositStatus = 'idle'
    },
    withdrawStart: (state, action: PayloadAction<WithdrawInfo>) => {
      state.withdrawStatus = 'loading'
    },
    withdrawSuccess: (state) => {
      state.withdrawStatus = 'success'
    },
    withdrawError: (state) => {
      state.withdrawStatus = 'error'
    },
    withdrawCancel: (state) => {
      state.withdrawStatus = 'idle'
    },
    fetchPoolInfo: (state) => {
      state.poolInfoFetchStatus = 'loading'
    },
    fetchPoolInfoSuccess: (state, action: PayloadAction<PoolInfo>) => {
      state.poolInfoFetchStatus = 'success'
      state.poolInfo = action.payload
    },
    fetchPoolInfoError: (state) => {
      state.poolInfoFetchStatus = 'error'
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'earn'),
      depositStatus: 'idle',
      withdrawStatus: 'idle',
      poolInfoFetchStatus: 'idle',
      poolInfo: undefined,
    }))
  },
})

export const {
  depositStart,
  depositSuccess,
  depositError,
  depositCancel,
  withdrawStart,
  withdrawSuccess,
  withdrawError,
  withdrawCancel,
  fetchPoolInfo,
  fetchPoolInfoSuccess,
  fetchPoolInfoError,
} = slice.actions

export default slice.reducer
