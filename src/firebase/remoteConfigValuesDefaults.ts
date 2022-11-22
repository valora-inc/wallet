import { RemoteConfigValues } from 'src/app/saga'
import { CreateAccountCopyTestType, InviteMethodType } from 'src/app/types'
import { DEFAULT_SENTRY_NETWORK_ERRORS, DEFAULT_SENTRY_TRACES_SAMPLE_RATE } from 'src/config'
import { DappConnectInfo } from 'src/dapps/types'
import { PaymentDeepLinkHandler } from 'src/merchantPayment/types'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  | 'celoEducationUri'
  | 'komenciAllowedDeployers'
  | 'sentryNetworkErrors'
  | 'superchargeTokenConfigByToken'
  | 'fiatAccountSchemaCountryOverrides'
> & {
  komenciAllowedDeployers: string
  sentryNetworkErrors: string
  superchargecUSDMin: number
  superchargecUSDMax: number
  superchargecEURMin: number
  superchargecEURMax: number
  superchargecREALMin: number
  superchargecREALMax: number
} = {
  hideVerification: false,
  celoEuroEnabled: true,
  inviteRewardsEnabled: false,
  inviteRewardCusd: 5,
  inviteRewardWeeklyLimit: 20,
  walletConnectV1Enabled: true,
  walletConnectV2Enabled: false,
  superchargeApy: 12,
  superchargecUSDMin: 10,
  superchargecUSDMax: 1000,
  superchargecEURMin: 10,
  superchargecEURMax: 1000,
  superchargecREALMin: 50,
  superchargecREALMax: 6000,
  komenciUseLightProxy: false,
  komenciAllowedDeployers: '',
  pincodeUseExpandedBlocklist: false,
  rewardPillText: JSON.stringify({
    en: 'Rewards',
    pt: 'Recompensas',
    es: 'Recompensas',
    de: 'Belohnungen',
  }),
  cashInButtonExpEnabled: false,
  rampCashInButtonExpEnabled: false,
  logPhoneNumberTypeEnabled: false,
  allowOtaTranslations: false,
  sentryTracesSampleRate: DEFAULT_SENTRY_TRACES_SAMPLE_RATE,
  sentryNetworkErrors: DEFAULT_SENTRY_NETWORK_ERRORS.join(','),
  maxNumRecentDapps: 0,
  skipVerification: false,
  showPriceChangeIndicatorInBalances: false,
  paymentDeepLinkHandler: PaymentDeepLinkHandler.Disabled,
  dappsWebViewEnabled: false,
  dappListApiUrl: null,
  skipProfilePicture: false,
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: false,
  dappConnectInfo: DappConnectInfo.Default,
  visualizeNFTsEnabledInHomeAssetsPage: false,
  coinbasePayEnabled: false,
  showSwapMenuInDrawerMenu: false,
  shouldShowRecoveryPhraseInSettings: false,
  createAccountCopyTestType: CreateAccountCopyTestType.Account,
  maxSwapSlippagePercentage: 2,
  inviteMethod: InviteMethodType.Escrow,
  showGuidedOnboardingCopy: false,
  centralPhoneVerificationEnabled: true,
  networkTimeoutSeconds: 30,
}
