import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { ActiveDapp, Dapp, DappCategory, DappConnectInfo } from 'src/dapps/types'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

export interface State {
  dappsWebViewEnabled: boolean
  activeDapp: ActiveDapp | null
  maxNumRecentDapps: number
  recentDapps: Dapp[]
  dappListApiUrl: string | null
  // TODO: update type of recentDapps and activeDapp to be string
  dappsList: Dapp[]
  dappsListLoading: boolean
  dappsListError: string | null
  dappsCategories: DappCategory[]
  dappConnectInfo: DappConnectInfo
}

const initialState: State = {
  dappsWebViewEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.dappsWebViewEnabled,
  activeDapp: null,
  maxNumRecentDapps: REMOTE_CONFIG_VALUES_DEFAULTS.maxNumRecentDapps,
  recentDapps: [],
  dappListApiUrl: null,
  dappsList: [],
  dappsListLoading: false,
  dappsListError: null,
  dappsCategories: [],
  dappConnectInfo: DappConnectInfo.Default,
}

export interface DappSelectedAction {
  dapp: ActiveDapp
}

export interface FetchDappsListCompletedAction {
  dapps: Dapp[]
  categories: DappCategory[]
}

export interface FetchDappsListErrorAction {
  error: string
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
    fetchDappsList: (state) => {
      state.dappsListLoading = true
      state.dappsListError = null
    },
    fetchDappsListCompleted: (state, action: PayloadAction<FetchDappsListCompletedAction>) => {
      state.dappsListLoading = false
      state.dappsListError = null
      state.dappsList = action.payload.dapps
      state.dappsCategories = action.payload.categories
    },
    fetchDappsListFailed: (state, action: PayloadAction<FetchDappsListErrorAction>) => {
      state.dappsListLoading = false
      state.dappsListError = action.payload.error
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
          state.dappListApiUrl = action.configValues.dappListApiUrl
          state.dappConnectInfo = action.configValues.dappConnectInfo
        }
      )
      .addCase(REHYDRATE, (state, action: RehydrateAction) => ({
        ...state,
        ...getRehydratePayload(action, 'dapps'),
        activeDapp: null,
      }))
  },
})

export const {
  dappSelected,
  dappSessionEnded,
  fetchDappsList,
  fetchDappsListCompleted,
  fetchDappsListFailed,
} = slice.actions

export default slice.reducer
