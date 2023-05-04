import { createSlice } from '@reduxjs/toolkit'
import InAppReview from 'react-native-in-app-review'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'

export interface State {
  initialized: boolean
  inAppRatingSupported: boolean
  lastInteractionTimestamp: number | null
}

const initialState: State = {
  initialized: false,
  // Android version >= 21 and iOS >= 10.3
  // https://github.com/MinaSamir11/react-native-in-app-review#usage
  inAppRatingSupported: !!InAppReview.isAvailable,
  lastInteractionTimestamp: null,
}

export const slice = createSlice({
  name: 'appReview',
  initialState,
  reducers: {
    setInitialized: (state, action) => {
      state.initialized = action.payload
    },
    inAppRatingSupported: (state, action) => {
      state.inAppRatingSupported = action.payload
    },
    setLastInteractionTimestamp: (state, action) => {
      state.lastInteractionTimestamp = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'appReview'),
    }))
  },
})

export const { inAppRatingSupported, setLastInteractionTimestamp, setInitialized } = slice.actions

export default slice.reducer
