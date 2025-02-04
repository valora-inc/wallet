import RNRestart from 'react-native-restart'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AppEvents } from 'src/analytics/Events'
import Logger from 'src/utils/Logger'

export const RESTART_APP_I18N_KEY = 'restartApp'

export function restartApp() {
  AppAnalytics.track(AppEvents.user_restart)
  Logger.info('utils/AppRestart/restartApp', 'Restarting app')
  RNRestart.restart()
}
