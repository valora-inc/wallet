import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export interface State {
  google: {
    loading: boolean
    idToken: string | null
    error: string | null
  }
}

export const initialState: State = {
  google: {
    loading: false,
    idToken: null,
    error: null,
  },
}

export const slice = createSlice({
  name: 'keylessBackup',
  initialState,
  reducers: {
    googleSignInStarted: (state) => {
      state.google.loading = true
      state.google.error = null
      state.google.idToken = null
    },
    googleSignInCompleted: (state, action: PayloadAction<{ idToken: string }>) => {
      state.google.loading = false
      state.google.idToken = action.payload.idToken
    },
    googleSignInFailed: (state, action: PayloadAction<{ error: string }>) => {
      state.google.loading = false
      state.google.error = action.payload.error
    },
  },
})

export const { googleSignInStarted, googleSignInCompleted, googleSignInFailed } = slice.actions

export default slice.reducer
