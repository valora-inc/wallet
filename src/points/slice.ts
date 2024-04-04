import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { ClaimHistory } from 'src/points/types'

export interface GetPointsHistorySucceededAction {
  newPointsHistory: ClaimHistory[]
  nextPageUrl: string | null
}

interface State {
  pointsHistory: ClaimHistory[]
  nextPageUrl: string | null
  getHistoryStatus: 'idle' | 'loading-initial' | 'loading-more' | 'error'
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
    getInitialHistoryStarted: (state) => ({
      ...state,
      pointsHistory: [],
      nextPageUrl: null,
      getHistoryStatus: 'loading-initial',
    }),

    getHistorySucceeded: (state, action: PayloadAction<GetPointsHistorySucceededAction>) => ({
      ...state,
      pointsHistory: [...state.pointsHistory, ...action.payload.newPointsHistory],
      nextPageUrl: action.payload.nextPageUrl,
      getHistoryStatus: 'idle',
    }),

    getHistoryError: (state) => ({
      ...state,
      getHistoryStatus: 'error',
    }),

    getMoreHistoryStarted: (state) => ({
      ...state,
      getHistoryStatus: 'loading-more',
    }),
  },
})

export const {
  getInitialHistoryStarted,
  getHistorySucceeded,
  getHistoryError,
  getMoreHistoryStarted,
} = slice.actions

export default slice.reducer
