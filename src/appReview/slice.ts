import { createSlice } from '@reduxjs/toolkit'
import InAppReview from 'react-native-in-app-review'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'

export interface State {
  inAppRatingSupported: boolean
  appRated: boolean
  lastInteractionTimestamp: number | null
}

const initialState: State = {
  // Android version >= 21 and iOS >= 10.3
  // https://github.com/MinaSamir11/react-native-in-app-review#usage
  inAppRatingSupported: !!InAppReview.isAvailable,
  appRated: false,
  lastInteractionTimestamp: null,
}

export const slice = createSlice({
  name: 'appReview',
  initialState,
  reducers: {
    inAppRatingSupported: (state, action) => {
      state.inAppRatingSupported = action.payload
    },
    setAppRated: (state, action) => {
      state.appRated = action.payload
      state.lastInteractionTimestamp = +new Date()
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'appReview'),
    }))
  },
})

export const { inAppRatingSupported, setAppRated } = slice.actions

export default slice.reducer
