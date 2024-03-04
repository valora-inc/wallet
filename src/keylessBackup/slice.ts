import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import {
  KeylessBackupDeleteStatus,
  KeylessBackupFlow,
  KeylessBackupStatus,
} from 'src/keylessBackup/types'

interface State {
  googleIdToken: string | null
  valoraKeyshare: string | null
  torusKeyshare: string | null
  backupStatus: KeylessBackupStatus
  deleteBackupStatus: KeylessBackupDeleteStatus
  showDeleteBackupError: boolean
}

const initialState: State = {
  googleIdToken: null,
  valoraKeyshare: null,
  torusKeyshare: null,
  backupStatus: KeylessBackupStatus.NotStarted,
  deleteBackupStatus: KeylessBackupDeleteStatus.NotStarted,
  showDeleteBackupError: false,
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
      action: PayloadAction<{ keyshare: string; keylessBackupFlow: KeylessBackupFlow; jwt: string }>
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
    keylessBackupShowZeroBalance: (state) => {
      state.backupStatus = KeylessBackupStatus.RestoreZeroBalance
    },
    keylessBackupAcceptZeroBalance: (state) => {
      state.backupStatus = KeylessBackupStatus.InProgress
    },
    keylessBackupBail: (state) => {
      state.googleIdToken = initialState.googleIdToken
      state.valoraKeyshare = initialState.valoraKeyshare
      state.torusKeyshare = initialState.torusKeyshare
      state.backupStatus = initialState.backupStatus
    },
    keylessBackupNotFound: (state) => {
      state.backupStatus = KeylessBackupStatus.NotFound
    },
    deleteKeylessBackupStarted: (state) => {
      state.deleteBackupStatus = KeylessBackupDeleteStatus.InProgress
    },
    deleteKeylessBackupCompleted: (state) => {
      state.deleteBackupStatus = KeylessBackupDeleteStatus.Completed
    },
    deleteKeylessBackupFailed: (state) => {
      state.deleteBackupStatus = KeylessBackupDeleteStatus.Failed
      state.showDeleteBackupError = true
    },
    hideDeleteKeylessBackupError: (state) => {
      state.showDeleteBackupError = false
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
  keylessBackupShowZeroBalance,
  keylessBackupAcceptZeroBalance,
  keylessBackupBail,
  keylessBackupNotFound,
  deleteKeylessBackupStarted,
  deleteKeylessBackupCompleted,
  deleteKeylessBackupFailed,
  hideDeleteKeylessBackupError,
} = slice.actions

export default slice.reducer
