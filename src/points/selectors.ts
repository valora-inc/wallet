import { RootState } from 'src/redux/reducers'

export const nextPageUrlSelector = (state: RootState) => {
  return state.points.nextPageUrl
}

export const pointsHistoryStatusSelector = (state: RootState) => {
  return state.points.getHistoryStatus
}

export const pointsHistorySelector = (state: RootState) => {
  return state.points.pointsHistory
}
