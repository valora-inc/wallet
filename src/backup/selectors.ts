import { RootState } from 'src/redux/reducers'

export const backupCompletedSelector = (state: RootState) => state.account.backupCompleted
