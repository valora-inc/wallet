import { RootState } from 'src/redux/reducers'

export const getPointsHistoryStatusSelector = (state: RootState) => {
  return state.points.getHistoryStatus
}

export const getPointsHistoryNextPageUrlSelector = (state: RootState) => {
  return state.points.nextPageUrl
}
