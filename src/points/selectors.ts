import { RootState } from 'src/redux/reducers'

export const getPointsHistoryNextPageUrlSelector = (state: RootState) => {
  return state.points.nextPageUrl
}
