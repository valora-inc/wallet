import * as Sentry from '@sentry/react-native'
import DeviceInfo from 'react-native-device-info'
import { select } from 'redux-saga/effects'
import { sentryTracesSampleRateSelector } from 'src/app/selectors'
import {
  BLOCKSCOUT_BASE_URL,
  DEFAULT_FORNO_URL,
  EXCHANGE_PROVIDER_LINKS,
  SENTRY_CLIENT_URL,
  SPEND_MERCHANT_LINKS,
} from 'src/config'
import networkConfig from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'sentry/Sentry'

// Set this to true, if you want to test Sentry on dev builds
export const SENTRY_ENABLED = !__DEV__ || false
// To test performance metrics on Sentry, set tracesSampleRate to 1
export const sentryRoutingInstrumentation = new Sentry.ReactNavigationInstrumentation()

export function* initializeSentry() {
  if (!SENTRY_ENABLED) {
    Logger.info(TAG, 'Sentry not enabled')
    return
  }

  if (!SENTRY_CLIENT_URL) {
    Logger.info(TAG, 'installSentry', 'Sentry URL not found, skiping instalation')
    return
  }

  const tracesSampleRate = yield select(sentryTracesSampleRateSelector)
  const tracingOrigins = [
    DEFAULT_FORNO_URL,
    BLOCKSCOUT_BASE_URL,
    networkConfig.blockchainApiUrl,
    networkConfig.odisUrl,
    networkConfig.komenciUrl,
    networkConfig.bidaliUrl,
    networkConfig.providerFetchUrl,
    networkConfig.simplexApiUrl,
    networkConfig.fetchUserLocationDataUrl,
    networkConfig.komenciLoadCheckEndpoint,
    networkConfig.walletConnectEndpoint,
    networkConfig.inhouseLiquditiyUrl,
    ...EXCHANGE_PROVIDER_LINKS.map(({ link }) => link),
    ...SPEND_MERCHANT_LINKS.map(({ link }) => link),
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
