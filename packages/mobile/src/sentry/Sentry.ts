import * as Sentry from '@sentry/react-native'
import DeviceInfo from 'react-native-device-info'
import { select } from 'redux-saga/effects'
import { sentryTracesSampleRateSelector } from 'src/app/selectors'
import { DEFAULT_FORNO_URL, isE2EEnv, SENTRY_CLIENT_URL } from 'src/config'
import networkConfig from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'sentry/Sentry'

// Set this to true, if you want to test Sentry on dev builds
// Set tracesSampleRate: 1 to capture all events for testing performance metrics in Sentry
// Set SENTRY_ENABLED to false during e2e tests
export const SENTRY_ENABLED = (!isE2EEnv && !__DEV__) || false
export const sentryRoutingInstrumentation = new Sentry.ReactNavigationInstrumentation()

export function* initializeSentry() {
  if (!SENTRY_ENABLED) {
    Logger.info(TAG, 'Sentry not enabled')
    return
  }

  if (!SENTRY_CLIENT_URL) {
    Logger.info(TAG, 'installSentry', 'Sentry URL not found, skipping installation')
    return
  }

  const tracesSampleRate = yield select(sentryTracesSampleRateSelector)
  const tracingOrigins = [
    DEFAULT_FORNO_URL,
    networkConfig.blockchainApiUrl,
    networkConfig.cloudFunctionsUrl,
    networkConfig.inHouseLiquidityURL,
  ]

  Sentry.init({
    dsn: SENTRY_CLIENT_URL,
    environment: DeviceInfo.getBundleId(),
    enableAutoSessionTracking: true,
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: sentryRoutingInstrumentation,
        tracingOrigins,
      }),
    ],
    tracesSampleRate,
  })

  Logger.info(TAG, 'installSentry', 'Sentry installation complete')
}

// This should not be called at cold start since it can slow down the cold start.
export function* initializeSentryUserContext() {
  const account = yield select(currentAccountSelector)

  if (!account) {
    return
  }
  Logger.debug(
    TAG,
    'initializeSentryUserContext',
    `Setting Sentry user context to account "${account}"`
  )
  Sentry.setUser({
    username: account,
  })
}
