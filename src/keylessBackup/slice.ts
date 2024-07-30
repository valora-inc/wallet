import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import {
  KeylessBackupDeleteStatus,
  KeylessBackupFlow,
  KeylessBackupOrigin,
  KeylessBackupStatus,
} from 'src/keylessBackup/types'

interface State {
  auth0IdToken: string | null
  valoraKeyshare: string | null
  torusKeyshare: string | null
  backupStatus: KeylessBackupStatus
  deleteBackupStatus: KeylessBackupDeleteStatus
  showDeleteBackupError: boolean
}

const initialState: State = {
  auth0IdToken: null,
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
    auth0SignInCompleted: (state, action: PayloadAction<{ idToken: string }>) => {
      state.auth0IdToken = action.payload.idToken
    },
    valoraKeyshareIssued: (
      state,
      action: PayloadAction<{
        keyshare: string
        keylessBackupFlow: KeylessBackupFlow
        origin: KeylessBackupOrigin
        jwt: string
      }>
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
      state.auth0IdToken = initialState.auth0IdToken
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
  auth0SignInCompleted,
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
