import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { NetworkId } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Address, Hex } from 'viem'
import { Position, Shortcut, ShortcutStatus } from './types'

type Status = 'idle' | 'loading' | 'success' | 'error'

type TriggeredShortcuts = Record<
  string,
  | {
      status: ShortcutStatus
      transactions: RawShortcutTransaction[]
      appName: string
      appImage: string
      appId: string
      networkId: NetworkId
      shortcutId: string
    }
  | undefined
>

interface State {
  positions: Position[]
  positionsFetchedAt?: number
  earnPositionIds: string[]
  status: Status
  shortcuts: Shortcut[]
  shortcutsStatus: Status
  previewApiUrl: string | null
  triggeredShortcutsStatus: TriggeredShortcuts
}

const initialState: State = {
  positions: [],
  earnPositionIds: [],
  status: 'idle',
  shortcuts: [],
  shortcutsStatus: 'idle',
  previewApiUrl: null,
  triggeredShortcutsStatus: {},
}

export interface RawShortcutTransaction {
  networkId: string // Is NetworkId but we need to check it's a valid value
  from: Address
  to: Address
  value?: string
  data: Hex
  gas?: string
  estimatedGasUse?: string
}

interface TriggerShortcut {
  id: string // only used in the app to display the execution status of the shortcut
  appName: string
  appImage: string
  data: {
    networkId: NetworkId
    address: string
    appId: string
    positionId: string
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
    fetchPositionsSuccess: (
      state,
      action: PayloadAction<{ positions: Position[]; earnPositionIds: string[]; fetchedAt: number }>
    ) => ({
      ...state,
      positions: action.payload.positions,
      earnPositionIds: action.payload.earnPositionIds,
      positionsFetchedAt: action.payload.fetchedAt,
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
      positionsFetchedAt: undefined,
      status: 'idle',
      shortcuts: [],
      shortcutsStatus: 'idle',
    }),
    previewModeDisabled: (state) => ({
      ...state,
      previewApiUrl: null,
      positions: [],
      positionsFetchedAt: undefined,
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
      const triggeredShortcut = state.triggeredShortcutsStatus[action.payload.id]
      if (!triggeredShortcut) {
        return
      }
      triggeredShortcut.status = 'pendingAccept'
      triggeredShortcut.transactions = action.payload.transactions
    },
    triggerShortcutFailure: (state, action: PayloadAction<string>) => {
      const triggeredShortcut = state.triggeredShortcutsStatus[action.payload]
      if (!triggeredShortcut) {
        return
      }
      triggeredShortcut.status = 'error'
    },
    executeShortcut: (
      state,
      action: PayloadAction<{
        id: string
        preparedTransactions: SerializableTransactionRequest[]
      }>
    ) => {
      const triggeredShortcut = state.triggeredShortcutsStatus[action.payload.id]
      if (!triggeredShortcut) {
        return
      }
      triggeredShortcut.status = 'accepting'
    },
    denyExecuteShortcut: (state, action: PayloadAction<string>) => {
      const triggeredShortcut = state.triggeredShortcutsStatus[action.payload]
      if (!triggeredShortcut) {
        return
      }
      triggeredShortcut.status = 'idle'
    },
    executeShortcutSuccess: (state, action: PayloadAction<string>) => {
      const triggeredShortcut = state.triggeredShortcutsStatus[action.payload]
      if (!triggeredShortcut) {
        return
      }
      triggeredShortcut.status = 'success'
    },
    executeShortcutFailure: (state, action: PayloadAction<string>) => {
      const triggeredShortcut = state.triggeredShortcutsStatus[action.payload]
      if (!triggeredShortcut) {
        return
      }
      triggeredShortcut.status = 'error'
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
