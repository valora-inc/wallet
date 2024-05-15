import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { DepositInfo } from 'src/earn/types'
import { getRehydratePayload } from 'src/redux/persist-helper'

interface State {
  depositStatus: 'idle' | 'started' | 'success' | 'error'
}

const initialState: State = {
  depositStatus: 'idle',
}

export const slice = createSlice({
  name: 'earn',
  initialState,
  reducers: {
    depositStart: (state, action: PayloadAction<DepositInfo>) => {
      state.depositStatus = 'started'
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
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'earn'),
      depositStatus: 'idle',
    }))
  },
})

export const { depositStart, depositSuccess, depositError, depositCancel } = slice.actions

export default slice.reducer
