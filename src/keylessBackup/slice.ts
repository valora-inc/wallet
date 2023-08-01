import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { KeylessBackupStatus, KeylessBackupFlow } from 'src/keylessBackup/types'

export interface State {
  google: {
    status: 'idle' | 'loading' | 'success' | 'error'
    idToken: string | null
  }
  valoraKeyshare: string | null
  backupStatus: KeylessBackupStatus | null
}

export const initialState: State = {
  google: {
    status: 'idle',
    idToken: null,
  },
  valoraKeyshare: null,
  backupStatus: null,
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
    valoraKeyshareIssued: (state, action: PayloadAction<{ keyshare: string }>) => {
      state.valoraKeyshare = action.payload.keyshare
    },
    keylessBackupStarted: (
      state,
      action: PayloadAction<{ keylessBackupFlow: KeylessBackupFlow }>
    ) => {
      state.backupStatus = KeylessBackupStatus.InProgress
    },
  },
})

export const {
  googleSignInStarted,
  googleSignInCompleted,
  googleSignInFailed,
  valoraKeyshareIssued,
  keylessBackupStarted,
} = slice.actions

export default slice.reducer
