import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { ClaimHistory, PointsActivity } from 'src/points/types'
import { REHYDRATE, RehydrateAction, getRehydratePayload } from 'src/redux/persist-helper'

interface GetPointsHistorySucceededAction {
  appendHistory: boolean
  newPointsHistory: ClaimHistory[]
  nextPageUrl: string | null
}

interface GetPointsHistoryStartedAction {
  getNextPage: boolean
}

export type PointsConfig = {
  activitiesById: {
    [activityId in PointsActivity]?: {
      pointsAmount: number
    }
  }
}
interface State {
  pointsHistory: ClaimHistory[]
  nextPageUrl: string | null
  getHistoryStatus: 'idle' | 'loading' | 'error'
  pointsConfig: PointsConfig
  pointsConfigStatus: 'idle' | 'loading' | 'error' | 'success'
}

const initialState: State = {
  pointsHistory: [],
  nextPageUrl: null,
  getHistoryStatus: 'idle',
  pointsConfig: { activitiesById: {} },
  pointsConfigStatus: 'idle',
}

const slice = createSlice({
  name: 'points',
  initialState,
  reducers: {
    getHistoryStarted: (state, _action: PayloadAction<GetPointsHistoryStartedAction>) => ({
      ...state,
      getHistoryStatus: 'loading',
    }),
    getHistorySucceeded: (state, action: PayloadAction<GetPointsHistorySucceededAction>) => ({
      ...state,
      pointsHistory: action.payload.appendHistory
        ? [...state.pointsHistory, ...action.payload.newPointsHistory]
        : action.payload.newPointsHistory,
      nextPageUrl: action.payload.nextPageUrl,
      getHistoryStatus: 'idle',
    }),
    getHistoryError: (state) => ({
      ...state,
      getHistoryStatus: 'error',
    }),
    getPointsConfigStarted: (state) => ({
      ...state,
      pointsConfigStatus: 'loading',
    }),
    getPointsConfigSucceeded: (state, action: PayloadAction<PointsConfig>) => ({
      ...state,
      pointsConfig: action.payload,
      pointsConfigStatus: 'success',
    }),
    getPointsConfigError: (state) => ({
      ...state,
      pointsConfigStatus: 'error',
    }),
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'points'),
      pointsConfig: { activitiesById: {} }, // always reset pointsConfig on rehydrate to ensure it's up to date
    }))
  },
})

export const {
  getHistoryStarted,
  getHistorySucceeded,
  getHistoryError,
  getPointsConfigError,
  getPointsConfigStarted,
  getPointsConfigSucceeded,
} = slice.actions

export default slice.reducer
