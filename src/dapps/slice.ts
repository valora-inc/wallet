import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { Dapp } from 'src/app/types'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

export enum DappSection {
  RecentlyUsed = 'recently used',
  Featured = 'featured',
  All = 'all',
}

export interface ActiveDapp extends Dapp {
  openedFrom: DappSection
}

export interface State {
  dappsWebViewEnabled: boolean
  activeDapp: ActiveDapp | null
  maxNumRecentDapps: number
  recentDapps: Dapp[]
  dappListApiUrl: string | null
  allDapps: Dapp[]
}

const initialState: State = {
  dappsWebViewEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.dappsWebViewEnabled,
  activeDapp: null,
  maxNumRecentDapps: REMOTE_CONFIG_VALUES_DEFAULTS.maxNumRecentDapps,
  recentDapps: [],
  dappListApiUrl: null,
  allDapps: [],
}

export interface DappSelectedAction {
  dapp: ActiveDapp
}

export interface FetchedAllDappsAction {
  allDapps: Dapp[]
}

export const slice = createSlice({
  name: 'dapps',
  initialState,
  reducers: {
    dappSelected: (state, action: PayloadAction<DappSelectedAction>) => {
      state.recentDapps = [
        action.payload.dapp,
        ...state.recentDapps.filter((recentDapp) => recentDapp.id !== action.payload.dapp.id),
      ]
      state.activeDapp = action.payload.dapp
    },
    dappSessionEnded: (state) => {
      state.activeDapp = null
    },
    fetchedAllDapps: (state, action: PayloadAction<FetchedAllDappsAction>) => {
      state.allDapps = action.payload.allDapps
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        AppActions.UPDATE_REMOTE_CONFIG_VALUES,
        (state, action: UpdateConfigValuesAction) => {
          state.dappsWebViewEnabled = action.configValues.dappsWebViewEnabled
          state.maxNumRecentDapps = action.configValues.maxNumRecentDapps
          state.dappsWebViewEnabled = action.configValues.dappsWebViewEnabled
        }
      )
      .addCase(REHYDRATE, (state, action: RehydrateAction) => ({
        ...state,
        ...getRehydratePayload(action, 'dapps'),
      }))
  },
})

export const { dappSelected, dappSessionEnded, fetchedAllDapps } = slice.actions

export default slice.reducer
