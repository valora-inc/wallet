import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { KeylessBackupFlow, KeylessBackupStatus } from 'src/keylessBackup/types'

export interface State {
  googleIdToken: string | null
  valoraKeyshare: string | null
  torusKeyshare: string | null
  backupStatus: KeylessBackupStatus
}

export const initialState: State = {
  googleIdToken: null,
  valoraKeyshare: null,
  torusKeyshare: null,
  backupStatus: KeylessBackupStatus.NotStarted,
}

export const slice = createSlice({
  name: 'keylessBackup',
  initialState,
  reducers: {
    googleSignInCompleted: (state, action: PayloadAction<{ idToken: string }>) => {
      state.googleIdToken = action.payload.idToken
    },
    valoraKeyshareIssued: (
      state,
      action: PayloadAction<{ keyshare: string; keylessBackupFlow: KeylessBackupFlow }>
    ) => {
      state.valoraKeyshare = action.payload.keyshare
    },
    torusKeyshareIssued: (state, action: PayloadAction<{ keyshare: string }>) => {
      state.torusKeyshare = action.payload.keyshare
    },
    keylessBackupStarted: (
      state,
      action: PayloadAction<{ keylessBackupFlow: KeylessBackupFlow }>
    ) => {
      state.backupStatus = KeylessBackupStatus.InProgress
    },
    keylessBackupFailed: (state) => {
      state.backupStatus = KeylessBackupStatus.Failed
    },
    keylessBackupCompleted: (state) => {
      state.backupStatus = KeylessBackupStatus.Completed
    },
  },
})

export const {
  googleSignInCompleted,
  valoraKeyshareIssued,
  torusKeyshareIssued,
  keylessBackupStarted,
  keylessBackupFailed,
  keylessBackupCompleted,
} = slice.actions

export default slice.reducer
