import { RootState } from 'src/redux/reducers'

export const keylessBackupStatusSelector = (state: RootState) => state.keylessBackup.backupStatus
export const torusKeyshareSelector = (state: RootState) => state.keylessBackup.torusKeyshare
export const deleteKeylessBackupStatusSelector = (state: RootState) =>
  state.keylessBackup.deleteBackupStatus
export const showDeleteKeylessBackupErrorSelector = (state: RootState) =>
  state.keylessBackup.showDeleteBackupError
