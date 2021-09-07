// Order is important, please don't change it unless you know what you're doing :D
import 'node-libs-react-native/globals'
import 'src/missingGlobals'
import 'src/forceCommunityAsyncStorage'
import 'src/setupE2eEnv' // This is only for E2E tests and has no effects when not running E2E tests
if (__DEV__) {
  import('./src/reactotronConfig').then(() => console.log('Reactotron Configured'))
}
import { AppRegistry } from 'react-native'
import Logger from 'src/utils/Logger'
// This needs to happen early so any errors (including in the store) get caught
import { SENTRY_ENABLED } from 'src/sentry/Sentry'
import App from 'src/app/App'
import * as Sentry from '@sentry/react-native'
import 'react-native-gesture-handler'
import { Text, TextInput } from 'react-native'

Logger.overrideConsoleLogs()

const defaultErrorHandler = ErrorUtils.getGlobalHandler()
const customErrorHandler = (e, isFatal) => {
  if (SENTRY_ENABLED) {
    Sentry.captureException(e)
  }
  Logger.error('RootErrorHandler', `Unhandled error. isFatal: ${isFatal}`, e)
  defaultErrorHandler(e, isFatal)
}
ErrorUtils.setGlobalHandler(customErrorHandler)

// Prevent Text elements font from scaling over 2
Text.defaultProps = {
  ...Text.defaultProps,
  maxFontSizeMultiplier: 2,
}

// Prevent TextInput font from scaling over 2
// Scale font to fit on TextInput elements
TextInput.defaultProps = {
  ...TextInput.defaultProps,
  maxFontSizeMultiplier: 2,
  adjustsFontSizeToFit: true,
}

AppRegistry.registerComponent('celo', () => App)
