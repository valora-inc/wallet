import * as Sentry from '@sentry/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { LogBox, StatusBar } from 'react-native'
import { Auth0Provider } from 'react-native-auth0'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableFreeze, enableScreens } from 'react-native-screens'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import AppInitGate from 'src/app/AppInitGate'
import ErrorBoundary from 'src/app/ErrorBoundary'
import { AUTH0_CLIENT_ID, AUTH0_DOMAIN, isE2EEnv } from 'src/config'
import i18n from 'src/i18n'
import NavigatorWrapper from 'src/navigator/NavigatorWrapper'
import { persistor, store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

Logger.debug('App/init', 'Current Language: ' + i18n.language)

// Explicitly enable screens for react-native-screens
enableScreens(true)
// Prevent inactive screens from rerendering https://reactnavigation.org/docs/native-stack-navigator#freezeonblur
enableFreeze(true)

const ignoreWarnings = [
  'componentWillReceiveProps',
  'Remote debugger', // To avoid "Remote debugger in background tab" warning
  'cancelTouches', // rn-screens warning on iOS
  'Setting a timer', // warns about long setTimeouts which are actually saga timeouts
  'Require cycle', // TODO: fix require cycles and remove this ;)
  // These are caused by node-libs-react-native's stream-http capability checks and are harmless to ignore
  // See https://github.com/jhiesey/stream-http/blob/cd697901d132cc20ea698079ac400b7cc11a7999/lib/capability.js#L48-L49
  "The provided value 'moz-chunked-arraybuffer' is not a valid 'responseType'",
  "The provided value 'ms-stream' is not a valid 'responseType'",
]
if (isE2EEnv) {
  ignoreWarnings.push('Overriding previous layout')
}
LogBox.ignoreLogs(ignoreWarnings)

const { decimalSeparator, groupingSeparator } = getNumberFormatSettings()

BigNumber.config({
  EXPONENTIAL_AT: 1e9, // toString almost never return exponential notation
  FORMAT: {
    decimalSeparator,
    groupSeparator: groupingSeparator,
    groupSize: 3,
  },
})

interface Props extends Record<string, unknown> {
  appStartedMillis: number
}

// Enables LayoutAnimation on Android. It makes transitions between states smoother.
// https://reactnative.dev/docs/layoutanimation
// Disabling it for now as it seems to cause blank white screens on certain android devices
// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true)
// }

export class App extends React.Component<Props> {
  reactLoadTime: number = Date.now()
  isConsumingInitialLink = false

  async componentDidMount() {
    if (isE2EEnv) {
      LogBox.ignoreAllLogs(true)
    }
  }

  render() {
    return (
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate persistor={persistor}>
            <Auth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID}>
              <AppInitGate
                appStartedMillis={this.props.appStartedMillis}
                reactLoadTime={this.reactLoadTime}
              >
                <StatusBar backgroundColor="transparent" barStyle="dark-content" />
                <ErrorBoundary>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <NavigatorWrapper />
                  </GestureHandlerRootView>
                </ErrorBoundary>
              </AppInitGate>
            </Auth0Provider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    )
  }
}

export default Sentry.wrap(App)
