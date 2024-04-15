import { RootState } from 'src/redux/reducers'

export const nextPageUrlSelector = (state: RootState) => {
  return state.points.nextPageUrl
}
