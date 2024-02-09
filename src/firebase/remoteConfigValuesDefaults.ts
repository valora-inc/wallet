import { RemoteConfigValues } from 'src/app/saga'
import { DEFAULT_SENTRY_NETWORK_ERRORS, DEFAULT_SENTRY_TRACES_SAMPLE_RATE } from 'src/config'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  | 'celoEducationUri'
  | 'sentryNetworkErrors'
  | 'superchargeTokenConfigByToken'
  | 'fiatAccountSchemaCountryOverrides'
  | 'celoNews'
> & {
  sentryNetworkErrors: string
  superchargecUSDMin: number
  superchargecUSDMax: number
  superchargecEURMin: number
  superchargecEURMax: number
  superchargecREALMin: number
  superchargecREALMax: number
  dappListApiUrl: string
  celoNews: string
  superchargeTokenConfigByToken: string
} = {
  celoEuroEnabled: true,
  inviteRewardsVersion: 'none',
  inviteRewardCusd: 5,
  inviteRewardWeeklyLimit: 20,
  walletConnectV1Enabled: true,
  walletConnectV2Enabled: true,
  superchargeApy: 12,
  superchargecUSDMin: 10,
  superchargecUSDMax: 1000,
  superchargecEURMin: 10,
  superchargecEURMax: 1000,
  superchargecREALMin: 50,
  superchargecREALMax: 6000,
  pincodeUseExpandedBlocklist: false,
  rewardPillText: JSON.stringify({
    en: 'Rewards',
    pt: 'Recompensas',
    es: 'Recompensas',
    de: 'Belohnungen',
  }),
  rampCashInButtonExpEnabled: false,
  logPhoneNumberTypeEnabled: false,
  allowOtaTranslations: false,
  sentryTracesSampleRate: DEFAULT_SENTRY_TRACES_SAMPLE_RATE,
  sentryNetworkErrors: DEFAULT_SENTRY_NETWORK_ERRORS.join(','),
  maxNumRecentDapps: 0,
  skipVerification: false,
  showPriceChangeIndicatorInBalances: false,
  dappsWebViewEnabled: false,
  dappListApiUrl: '',
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: false,
  visualizeNFTsEnabledInHomeAssetsPage: false,
  coinbasePayEnabled: false,
  showSwapMenuInDrawerMenu: false,
  maxSwapSlippagePercentage: 2,
  networkTimeoutSeconds: 30,
  celoNews: JSON.stringify({} as RemoteConfigValues['celoNews']),
  twelveWordMnemonicEnabled: false,
  priceImpactWarningThreshold: 0.04,
  superchargeRewardContractAddress: '',
  superchargeTokenConfigByToken: JSON.stringify(
    {} as RemoteConfigValues['superchargeTokenConfigByToken']
  ),
}
