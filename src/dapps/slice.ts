import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { ActiveDapp, Dapp, DappCategory } from 'src/dapps/types'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

export interface State {
  dappsWebViewEnabled: boolean
  activeDapp: ActiveDapp | null
  maxNumRecentDapps: number
  recentDappIds: string[]
  dappListApiUrl: string | null
  dappsList: Dapp[]
  dappsListLoading: boolean
  dappsListError: string | null
  dappsCategories: DappCategory[]
  favoriteDappIds: string[]
  mostPopularDappIds: string[]
}

const initialState: State = {
  dappsWebViewEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.dappsWebViewEnabled,
  activeDapp: null,
  maxNumRecentDapps: REMOTE_CONFIG_VALUES_DEFAULTS.maxNumRecentDapps,
  recentDappIds: [],
  dappListApiUrl: REMOTE_CONFIG_VALUES_DEFAULTS.dappListApiUrl,
  dappsList: [],
  dappsListLoading: false,
  dappsListError: null,
  dappsCategories: [],
  favoriteDappIds: [],
  mostPopularDappIds: [],
}

export interface DappSelectedAction {
  dapp: ActiveDapp
}

export interface FetchDappsListCompletedAction {
  dapps: Dapp[]
  categories: DappCategory[]
  mostPopularDappIds: string[]
}

export interface FetchDappsListErrorAction {
  error: string
}

export interface FavoriteDappAction {
  dappId: string
}

export const slice = createSlice({
  name: 'dapps',
  initialState,
  reducers: {
    dappSelected: (state, action: PayloadAction<DappSelectedAction>) => {
      state.recentDappIds = [
        action.payload.dapp.id,
        ...state.recentDappIds.filter((recentDappId) => recentDappId !== action.payload.dapp.id),
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
      const dappIds = action.payload.dapps.map((dapp) => dapp.id)

      state.dappsListLoading = false
      state.dappsListError = null
      state.dappsList = action.payload.dapps
      state.dappsCategories = action.payload.categories
      state.recentDappIds = state.recentDappIds.filter((recentDappId) =>
        dappIds.includes(recentDappId)
      )
      state.favoriteDappIds = state.favoriteDappIds.filter((favoriteDappId) =>
        dappIds.includes(favoriteDappId)
      )
      state.mostPopularDappIds = action.payload.mostPopularDappIds
    },
    fetchDappsListFailed: (state, action: PayloadAction<FetchDappsListErrorAction>) => {
      state.dappsListLoading = false
      state.dappsListError = action.payload.error
    },
    favoriteDapp: (state, action: PayloadAction<FavoriteDappAction>) => {
      state.favoriteDappIds = [...new Set([...state.favoriteDappIds, action.payload.dappId])]
    },
    unfavoriteDapp: (state, action: PayloadAction<FavoriteDappAction>) => {
      state.favoriteDappIds = state.favoriteDappIds.filter(
        (dappId) => dappId !== action.payload.dappId
      )
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
  favoriteDapp,
  unfavoriteDapp,
} = slice.actions

export default slice.reducer
