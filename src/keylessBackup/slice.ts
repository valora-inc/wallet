import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { KeylessBackupFlow, KeylessBackupStatus } from 'src/keylessBackup/types'

export interface State {
  googleIdToken: string | null
  valoraKeyshare: string | null
  backupStatus: KeylessBackupStatus
}

export const initialState: State = {
  googleIdToken: null,
  valoraKeyshare: null,
  backupStatus: KeylessBackupStatus.NotStarted,
}

export const slice = createSlice({
  name: 'keylessBackup',
  initialState,
  reducers: {
    googleSignInCompleted: (state, action: PayloadAction<{ idToken: string }>) => {
      state.googleIdToken = action.payload.idToken
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

export const { googleSignInCompleted, valoraKeyshareIssued, keylessBackupStarted } = slice.actions

export default slice.reducer
