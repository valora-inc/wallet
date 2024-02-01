import { RemoteConfigValues } from 'src/app/saga'
import { DappConnectInfo } from 'src/dapps/types'

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
  celoNews: string
  superchargeTokenConfigByToken: string
} = {
  celoEuroEnabled: true,
  inviteRewardsVersion: 'none',
  inviteRewardCusd: 1,
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
  pincodeUseExpandedBlocklist: true,
  rewardPillText: JSON.stringify({
    en: 'Rewards',
    pt: 'Recompensas',
    es: 'Recompensas',
    de: 'Belohnungen',
  }),
  rampCashInButtonExpEnabled: false,
  logPhoneNumberTypeEnabled: false,
  allowOtaTranslations: false,
  sentryTracesSampleRate: 0.2,
  sentryNetworkErrors: '',
  dappListApiUrl: 'https://us-central1-celo-mobile-alfajores.cloudfunctions.net/dappList',
  maxNumRecentDapps: 4,
  skipVerification: false,
  showPriceChangeIndicatorInBalances: false,
  dappsWebViewEnabled: true,
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: true,
  dappConnectInfo: DappConnectInfo.Basic,
  visualizeNFTsEnabledInHomeAssetsPage: false,
  coinbasePayEnabled: false,
  showSwapMenuInDrawerMenu: false,
  maxSwapSlippagePercentage: 2,
  networkTimeoutSeconds: 30,
  dappFavoritesEnabled: false,
  celoNews: JSON.stringify({} as RemoteConfigValues['celoNews']),
  twelveWordMnemonicEnabled: true,
  dappsMinimalDisclaimerEnabled: false,
  priceImpactWarningThreshold: 0.04,
  superchargeRewardContractAddress: '',
  superchargeTokenConfigByToken: JSON.stringify(
    {} as RemoteConfigValues['superchargeTokenConfigByToken']
  ),
}
