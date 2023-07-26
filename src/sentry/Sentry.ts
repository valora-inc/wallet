import * as Sentry from '@sentry/react-native'
import DeviceInfo from 'react-native-device-info'
import { sentryTracesSampleRateSelector } from 'src/app/selectors'
import { APP_BUNDLE_ID, SENTRY_CLIENT_URL, SENTRY_ENABLED } from 'src/config'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { currentAccountSelector } from 'src/web3/selectors'
import { select } from 'typed-redux-saga'

const TAG = 'sentry/Sentry'

// Set this to true, if you want to test Sentry on dev builds
// Set tracesSampleRate: 1 to capture all events for testing performance metrics in Sentry
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

  // Tentative to avoid Sentry reports from apps that modified the bundle id from published builds
  // We're not yet sure who/what does that. Suspecting an automated tool testing the published builds.
  // It's polluting the Sentry dashboard unnecessarily, since the environment is based on the bundle id.
  const bundleId = DeviceInfo.getBundleId()
  if (bundleId !== APP_BUNDLE_ID) {
    Logger.info(TAG, 'Sentry skipped for this app')
    return
  }

  const tracesSampleRate = yield* select(sentryTracesSampleRateSelector)
  // tracingOrigins is an array of regexes to match domain names against:
  //   https://docs.sentry.io/platforms/javascript/performance/instrumentation/automatic-instrumentation/#tracingorigins
  // If you want to match against a specific domain (which we do) make sure to
  // use the domain name (not the URL).
  const tracingOrigins = networkConfig.sentryTracingUrls.map((url) => {
    // hostname does not include the port (while host does include the port).
    // Use hostname because it will match agaist a request to the host on any
    // port.
    return new URL(url).hostname
  })

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
  const account = yield* select(currentAccountSelector)

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
