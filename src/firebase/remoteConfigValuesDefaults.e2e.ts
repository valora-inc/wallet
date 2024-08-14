import { RemoteConfigValues } from 'src/app/saga'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  'celoEducationUri' | 'sentryNetworkErrors' | 'fiatAccountSchemaCountryOverrides' | 'celoNews'
> & {
  sentryNetworkErrors: string
  celoNews: string
} = {
  inviteRewardsVersion: 'none',
  walletConnectV2Enabled: true,
  pincodeUseExpandedBlocklist: true,
  logPhoneNumberTypeEnabled: false,
  allowOtaTranslations: false,
  sentryTracesSampleRate: 0.2,
  sentryNetworkErrors: '',
  dappListApiUrl: 'https://us-central1-celo-mobile-alfajores.cloudfunctions.net/dappList',
  maxNumRecentDapps: 4,
  dappsWebViewEnabled: true,
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: true,
  coinbasePayEnabled: false,
  showSwapMenuInDrawerMenu: false,
  maxSwapSlippagePercentage: 2,
  networkTimeoutSeconds: 30,
  celoNews: JSON.stringify({} as RemoteConfigValues['celoNews']),
  priceImpactWarningThreshold: 0.04,
}
