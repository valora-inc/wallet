import { RootState } from 'src/redux/reducers'

export const keylessBackupStatusSelector = (state: RootState) => state.keylessBackup.backupStatus
