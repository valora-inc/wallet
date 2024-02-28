import { createSlice } from '@reduxjs/toolkit'

export interface State {
  claimStatus: 'idle' | 'loading' | 'error'
}

const initialState: State = {
  claimStatus: 'idle',
}

const slice = createSlice({
  name: 'jumpstart',
  initialState,
  reducers: {
    jumpstartClaimStarted: (state) => ({
      ...state,
      claimStatus: 'loading',
    }),

    jumpstartClaimSucceeded: (state) => ({
      ...state,
      claimStatus: 'idle',
    }),

    jumpstartClaimFailed: (state) => ({
      ...state,
      claimStatus: 'error',
    }),

    jumpstartLoadingDismissed: (state) => ({
      ...state,
      claimStatus: 'idle',
    }),

    jumpstartErrorDismissed: (state) => ({
      ...state,
      claimStatus: 'idle',
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
