import { RemoteConfigValues } from 'src/app/saga'
import {
  DEFAULT_SENTRY_NETWORK_ERRORS,
  DEFAULT_SENTRY_TRACES_SAMPLE_RATE,
  isE2EEnv,
} from 'src/config'

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
  pincodeUseExpandedBlocklist: isE2EEnv ? true : false,
  logPhoneNumberTypeEnabled: false,
  allowOtaTranslations: false,
  sentryTracesSampleRate: DEFAULT_SENTRY_TRACES_SAMPLE_RATE,
  sentryNetworkErrors: DEFAULT_SENTRY_NETWORK_ERRORS.join(','),
  maxNumRecentDapps: isE2EEnv ? 4 : 0,
  dappsWebViewEnabled: isE2EEnv ? true : false,
  dappListApiUrl: isE2EEnv
    ? 'https://us-central1-celo-mobile-alfajores.cloudfunctions.net/dappList'
    : '',
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: isE2EEnv ? true : false,
  coinbasePayEnabled: false,
  showSwapMenuInDrawerMenu: false,
  maxSwapSlippagePercentage: 2,
  networkTimeoutSeconds: 30,
  celoNews: JSON.stringify({} as RemoteConfigValues['celoNews']),
  priceImpactWarningThreshold: 0.04,
}
