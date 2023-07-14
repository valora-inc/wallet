import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { Position, Shortcut } from './types'

type Status = 'idle' | 'loading' | 'success' | 'error'

export interface State {
  positions: Position[]
  status: Status
  shortcuts: Shortcut[]
  shortcutsStatus: Status
  previewApiUrl: string | null
  triggeredShortcutsStatus: Record<string, Status>
}

const initialState: State = {
  positions: [],
  status: 'idle',
  shortcuts: [],
  shortcutsStatus: 'idle',
  previewApiUrl: null,
  triggeredShortcutsStatus: {},
}

interface TriggerShortcut {
  id: string // only used in the app to display the execution status of the shortcut
  network: string
  address: string
  appId: string
  positionAddress: string
  shortcutId: string
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
    fetchShortcutsStart: (state) => ({
      ...state,
      shortcutsStatus: 'loading',
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
      positions: [],
      status: 'idle',
      shortcuts: [],
      shortcutsStatus: 'idle',
    }),
    previewModeDisabled: (state) => ({
      ...state,
      previewApiUrl: null,
      positions: [],
      status: 'idle',
      shortcuts: [],
      shortcutsStatus: 'idle',
    }),
    triggerShortcut: (state, action: PayloadAction<TriggerShortcut>) => {
      state.triggeredShortcutsStatus[action.payload.id] = 'loading'
    },
    triggerShortcutSuccess: (state, action: PayloadAction<string>) => {
      state.triggeredShortcutsStatus[action.payload] = 'success'
    },
    triggerShortcutFailure: (state, action: PayloadAction<string>) => {
      state.triggeredShortcutsStatus[action.payload] = 'error'
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'positions'),
      status: 'idle',
      shortcutsStatus: 'idle',
      triggeredShortcutsStatus: {},
    }))
  },
})

export const {
  fetchPositionsStart,
  fetchPositionsSuccess,
  fetchPositionsFailure,
  fetchShortcutsStart,
  fetchShortcutsSuccess,
  fetchShortcutsFailure,
  previewModeEnabled,
  previewModeDisabled,
  triggerShortcut,
  triggerShortcutSuccess,
  triggerShortcutFailure,
} = slice.actions

export default slice.reducer
