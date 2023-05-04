import { RootState } from 'src/redux/reducers'

export const lastInteractionTimestampSelector = (state: RootState) =>
  state.appReview.lastInteractionTimestamp
