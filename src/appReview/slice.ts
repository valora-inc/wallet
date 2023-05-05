import { createSlice } from '@reduxjs/toolkit'

export interface State {
  lastInteractionTimestamp: number | null
}

const initialState: State = {
  lastInteractionTimestamp: null,
}

export const slice = createSlice({
  name: 'appReview',
  initialState,
  reducers: {
    inAppReviewCalled: (state, action) => {
      state.lastInteractionTimestamp = action.payload
    },
  },
})

export const { inAppReviewCalled } = slice.actions

export default slice.reducer
