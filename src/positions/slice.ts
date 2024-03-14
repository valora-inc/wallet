import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { Position, Shortcut, ShortcutStatus } from './types'
import { NetworkId } from 'src/transactions/types'

type Status = 'idle' | 'loading' | 'success' | 'error'

export type TriggeredShortcuts = Record<
  string,
  {
    status: ShortcutStatus
    transactions: RawShortcutTransaction[]
    appName: string
    appImage: string
    appId: string
    networkId: NetworkId
    shortcutId: string
  }
>

interface State {
  positions: Position[]
  status: Status
  shortcuts: Shortcut[]
  shortcutsStatus: Status
  previewApiUrl: string | null
  triggeredShortcutsStatus: TriggeredShortcuts
}

const initialState: State = {
  positions: [],
  status: 'idle',
  shortcuts: [],
  shortcutsStatus: 'idle',
  previewApiUrl: null,
  triggeredShortcutsStatus: {},
}

export interface RawShortcutTransaction {
  to: string
  from: string
  data: string
  network: string
}

interface TriggerShortcut {
  id: string // only used in the app to display the execution status of the shortcut
  appName: string
  appImage: string
  data: {
    networkId: NetworkId
    address: string
    appId: string
    positionAddress: string
    shortcutId: string
  }
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
      state.triggeredShortcutsStatus[action.payload.id] = {
        status: 'loading',
        appName: action.payload.appName,
        appImage: action.payload.appImage,
        transactions: [],
        appId: action.payload.data.appId,
        networkId: action.payload.data.networkId,
        shortcutId: action.payload.data.shortcutId,
      }
    },
    triggerShortcutSuccess: (
      state,
      action: PayloadAction<{
        id: string
        transactions: RawShortcutTransaction[]
      }>
    ) => {
      state.triggeredShortcutsStatus[action.payload.id].status = 'pendingAccept'
      state.triggeredShortcutsStatus[action.payload.id].transactions = action.payload.transactions
    },
    triggerShortcutFailure: (state, action: PayloadAction<string>) => {
      state.triggeredShortcutsStatus[action.payload].status = 'error'
    },
    executeShortcut: (state, action: PayloadAction<string>) => {
      state.triggeredShortcutsStatus[action.payload].status = 'accepting'
    },
    denyExecuteShortcut: (state, action: PayloadAction<string>) => {
      state.triggeredShortcutsStatus[action.payload].status = 'idle'
    },
    executeShortcutSuccess: (state, action: PayloadAction<string>) => {
      state.triggeredShortcutsStatus[action.payload].status = 'success'
    },
    executeShortcutFailure: (state, action: PayloadAction<string>) => {
      state.triggeredShortcutsStatus[action.payload].status = 'error'
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
  executeShortcut,
  executeShortcutSuccess,
  executeShortcutFailure,
  denyExecuteShortcut,
  triggerShortcutSuccess,
  triggerShortcutFailure,
} = slice.actions

export default slice.reducer
