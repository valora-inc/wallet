import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

const accountKeyScreens: string[] = [
  Screens.BackupIntroduction,
  Screens.AccountKeyEducation,
  Screens.PincodeEnter,
  Screens.BackupPhrase,
  Screens.BackupQuiz,
]

export const doingBackupFlowSelector = (state: RootState) => {
  return accountKeyScreens.indexOf(state.app.activeScreen) >= 0
}

export const backupCompletedSelector = (state: RootState) => state.account.backupCompleted
