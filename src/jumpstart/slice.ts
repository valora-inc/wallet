import { createSlice } from '@reduxjs/toolkit'

export interface State {
  showLoading: boolean
  showError: boolean
}

export const initialState = {
  showLoading: false,
  showError: false,
}

const slice = createSlice({
  name: 'jumpstart',
  initialState,
  reducers: {
    jumpstartClaimStarted: (state) => ({
      ...state,
      showLoading: true,
      showError: false,
    }),

    jumpstartClaimSucceeded: (state) => ({
      ...state,
      showLoading: false,
      showError: false,
    }),

    jumpstartClaimFailed: (state) => ({
      ...state,
      showLoading: false,
      showError: true,
    }),

    jumpstartLoadingDismissed: (state) => ({
      ...state,
      showLoading: false,
    }),

    jumpstartErrorDismissed: (state) => ({
      ...state,
      showError: false,
    }),
  },
})

export const {
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
  jumpstartClaimFailed,
  jumpstartLoadingDismissed,
  jumpstartErrorDismissed,
} = slice.actions

export default slice.reducer
