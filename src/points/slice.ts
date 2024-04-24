import { PayloadAction, createAction, createSlice } from '@reduxjs/toolkit'
import { ClaimHistory, PointsActivityId, PointsEvent, isClaimActivityId } from 'src/points/types'
import { REHYDRATE, RehydrateAction, getRehydratePayload } from 'src/redux/persist-helper'

interface GetPointsHistorySucceededAction {
  appendHistory: boolean
  newPointsHistory: ClaimHistory[]
  nextPageUrl: string | null
}

interface GetPointsHistoryStartedAction {
  getNextPage: boolean
}

interface GetPointsHistoryErrorAction {
  resetHistory: boolean
}

export type PointsConfig = {
  activitiesById: {
    [activityId in PointsActivityId]?: {
      pointsAmount: number
    }
  }
}

export interface PendingPointsEvent {
  id: string
  timestamp: string
  event: PointsEvent
}

export interface State {
  pointsHistory: ClaimHistory[]
  nextPageUrl: string | null
  getHistoryStatus: 'idle' | 'loading' | 'error'
  pointsConfig: PointsConfig
  pointsConfigStatus: 'idle' | 'loading' | 'error' | 'success'
  pendingPointsEvents: PendingPointsEvent[]
}

const initialState: State = {
  pointsHistory: [],
  nextPageUrl: null,
  getHistoryStatus: 'idle',
  pointsConfig: { activitiesById: {} },
  pointsConfigStatus: 'idle',
  pendingPointsEvents: [],
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
    getHistoryError: (state, action: PayloadAction<GetPointsHistoryErrorAction>) => ({
      ...state,
      getHistoryStatus: 'error',
      pointsHistory: action.payload.resetHistory ? [] : state.pointsHistory,
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
    getPointsConfigRetry: (state) => ({
      ...state,
    }),
    sendPointsEventStarted: (state, action: PayloadAction<PendingPointsEvent>) => ({
      ...state,
      pendingPointsEvents: [...state.pendingPointsEvents, action.payload],
    }),
    pointsEventProcessed: (state, action: PayloadAction<Pick<PendingPointsEvent, 'id'>>) => ({
      ...state,
      pendingPointsEvents: state.pendingPointsEvents.filter(
        (event) => event.id !== action.payload.id
      ),
    }),
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'points'),
      pointsConfig: { activitiesById: {} }, // always reset pointsConfig on rehydrate to ensure it's up to date
      pointsHistory: state.pointsHistory.filter((record) => isClaimActivityId(record.activityId)), // filter in case new app version removed support for an activityId
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
  getPointsConfigRetry,
  sendPointsEventStarted,
  pointsEventProcessed,
} = slice.actions

// action handled in saga
export const trackPointsEvent = createAction<PointsEvent>('points/trackPointsEvent')

export default slice.reducer
