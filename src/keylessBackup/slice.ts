import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export interface State {
  google: {
    status: 'idle' | 'loading' | 'success' | 'error'
    idToken: string | null
  }
}

export const initialState: State = {
  google: {
    status: 'idle',
    idToken: null,
  },
}

export const slice = createSlice({
  name: 'keylessBackup',
  initialState,
  reducers: {
    googleSignInStarted: (state) => {
      state.google.status = 'loading'
      state.google.idToken = null
    },
    googleSignInCompleted: (state, action: PayloadAction<{ idToken: string }>) => {
      state.google.status = 'success'
      state.google.idToken = action.payload.idToken
    },
    googleSignInFailed: (state) => {
      state.google.status = 'error'
    },
  },
})

export const { googleSignInStarted, googleSignInCompleted, googleSignInFailed } = slice.actions

export default slice.reducer
