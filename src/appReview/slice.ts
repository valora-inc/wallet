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
    setLastInteractionTimestamp: (state, action) => {
      state.lastInteractionTimestamp = action.payload
    },
  },
})

export const { setLastInteractionTimestamp } = slice.actions

export default slice.reducer
