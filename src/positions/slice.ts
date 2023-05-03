import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { fetchTokenBalances } from 'src/tokens/slice'
import { Position } from './types'

export interface State {
  positions: Position[]
  status: 'idle' | 'loading' | 'success' | 'error'
}

const initialState: State = {
  positions: [],
  status: 'idle',
}

const slice = createSlice({
  name: 'positions',
  initialState,
  reducers: {
    fetchPositions: (state) => ({
      ...state,
      status: 'loading',
    }),
    fetchPositionsSuccess: (state, action: PayloadAction<Position[]>) => ({
      ...state,
      positions: action.payload,
      status: 'success',
    }),
    fetchPositionsFailure: (state) => ({
      ...state,
      status: 'error',
    }),
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'positions'),
      status: 'idle',
    }))
    builder.addCase(fetchTokenBalances.type, (state) => ({
      ...state,
      status: 'loading',
    }))
  },
})

export const { fetchPositions, fetchPositionsSuccess, fetchPositionsFailure } = slice.actions

export default slice.reducer
