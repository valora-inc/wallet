import { RemoteConfigValues } from 'src/app/saga'
import { DEFAULT_SENTRY_NETWORK_ERRORS, DEFAULT_SENTRY_TRACES_SAMPLE_RATE } from 'src/config'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  'sentryNetworkErrors' | 'fiatAccountSchemaCountryOverrides'
> & {
  sentryNetworkErrors: string
} = {
  inviteRewardsVersion: 'none',
  allowOtaTranslations: false,
  sentryTracesSampleRate: DEFAULT_SENTRY_TRACES_SAMPLE_RATE,
  sentryNetworkErrors: DEFAULT_SENTRY_NETWORK_ERRORS.join(','),
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: false,
}
