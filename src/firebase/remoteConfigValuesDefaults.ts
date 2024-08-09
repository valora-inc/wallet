import { RemoteConfigValues } from 'src/app/saga'
import { DEFAULT_SENTRY_NETWORK_ERRORS, DEFAULT_SENTRY_TRACES_SAMPLE_RATE } from 'src/config'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  'celoEducationUri' | 'sentryNetworkErrors' | 'fiatAccountSchemaCountryOverrides' | 'celoNews'
> & {
  sentryNetworkErrors: string
  dappListApiUrl: string
  celoNews: string
} = {
  inviteRewardsVersion: 'none',
  walletConnectV2Enabled: true,
  pincodeUseExpandedBlocklist: false,
  logPhoneNumberTypeEnabled: false,
  allowOtaTranslations: false,
  sentryTracesSampleRate: DEFAULT_SENTRY_TRACES_SAMPLE_RATE,
  sentryNetworkErrors: DEFAULT_SENTRY_NETWORK_ERRORS.join(','),
  maxNumRecentDapps: 0,
  dappsWebViewEnabled: false,
  dappListApiUrl: '',
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: false,
  coinbasePayEnabled: false,
  showSwapMenuInDrawerMenu: false,
  maxSwapSlippagePercentage: 2,
  networkTimeoutSeconds: 30,
  celoNews: JSON.stringify({} as RemoteConfigValues['celoNews']),
  priceImpactWarningThreshold: 0.04,
}
