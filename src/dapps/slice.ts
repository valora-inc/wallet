import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ActiveDapp, Dapp, DappCategory } from 'src/dapps/types'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

interface State {
  activeDapp: ActiveDapp | null
  recentDappIds: string[]
  dappsList: Dapp[]
  dappsListLoading: boolean
  dappsListError: string | null
  dappsCategories: DappCategory[]
  favoriteDappIds: string[]
  mostPopularDappIds: string[]
}

const initialState: State = {
  activeDapp: null,
  recentDappIds: [],
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
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
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
