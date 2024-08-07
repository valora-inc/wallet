import { Platform } from 'react-native'
import RNExitApp from 'react-native-exit-app'
import { RestartAndroid } from 'react-native-restart-android'
import { AppEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import Logger from 'src/utils/Logger'

export const RESTART_APP_I18N_KEY = Platform.OS === 'android' ? 'restartApp' : 'quitApp'

export function restartApp() {
  AppAnalytics.track(AppEvents.user_restart)
  Logger.info('utils/AppRestart/restartApp', 'Restarting app')
  if (Platform.OS === 'android') {
    RestartAndroid.restart()
  } else {
    // We can't restart on iOS, so just exit ;)
    RNExitApp.exitApp()
  }
}
