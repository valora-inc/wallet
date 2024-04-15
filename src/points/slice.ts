import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { ClaimHistory } from 'src/points/types'

interface GetPointsHistorySucceededAction {
  appendHistory: boolean
  newPointsHistory: ClaimHistory[]
  nextPageUrl: string | null
}

interface GetPointsHistoryStartedAction {
  getNextPage: boolean
}

interface State {
  pointsHistory: ClaimHistory[]
  nextPageUrl: string | null
  getHistoryStatus: 'idle' | 'loading' | 'error'
}

const initialState: State = {
  pointsHistory: [],
  nextPageUrl: null,
  getHistoryStatus: 'idle',
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
  },
})

export const { getHistoryStarted, getHistorySucceeded, getHistoryError } = slice.actions

export default slice.reducer
