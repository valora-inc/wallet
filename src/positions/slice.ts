import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { Position, Shortcut } from './types'

export interface State {
  positions: Position[]
  status: 'idle' | 'loading' | 'success' | 'error'
  shortcuts: Shortcut[]
  shortcutsStatus: 'idle' | 'success' | 'error'
  previewApiUrl: string | null
}

const initialState: State = {
  positions: [],
  status: 'idle',
  shortcuts: [],
  shortcutsStatus: 'idle',
  previewApiUrl: null,
}

const slice = createSlice({
  name: 'positions',
  initialState,
  reducers: {
    fetchPositionsStart: (state) => ({
      ...state,
      status: 'loading',
    }),
    fetchPositionsSuccess: (state, action: PayloadAction<Position[]>) => ({
      ...state,
      positions: action.payload,
      status: 'success',
    }),
    fetchPositionsFailure: (state, action: PayloadAction<Error>) => ({
      ...state,
      status: 'error',
    }),
    fetchShortcutsSuccess: (state, action: PayloadAction<Shortcut[]>) => ({
      ...state,
      shortcuts: action.payload,
      shortcutsStatus: 'success',
    }),
    fetchShortcutsFailure: (state, action: PayloadAction<Error>) => ({
      ...state,
      shortcutsStatus: 'error',
    }),
    previewModeEnabled: (state, action: PayloadAction<string>) => ({
      ...state,
      previewApiUrl: action.payload,
    }),
    previewModeDisabled: (state) => ({
      ...state,
      previewApiUrl: null,
    }),
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'positions'),
      status: 'idle',
      shortcutsStatus: 'idle',
    }))
  },
})

export const {
  fetchPositionsStart,
  fetchPositionsSuccess,
  fetchPositionsFailure,
  fetchShortcutsSuccess,
  fetchShortcutsFailure,
  previewModeEnabled,
  previewModeDisabled,
} = slice.actions

export default slice.reducer
