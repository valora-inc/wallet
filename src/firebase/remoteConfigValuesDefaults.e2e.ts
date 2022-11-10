import { RemoteConfigValues } from 'src/app/saga'
import { CreateAccountCopyTestType, InviteMethodType } from 'src/app/types'
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
  inviteRewardCusd: 1,
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
  komenciAllowedDeployers:
    '0xbDb92Ca42559adc5adC20a1E4985dC7c476483be,0x4cda887Bce324109535814D49b74c6a560fAe1D9',
  pincodeUseExpandedBlocklist: true,
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
  sentryTracesSampleRate: 0.2,
  sentryNetworkErrors: '',
  biometryEnabled: false,
  dappListApiUrl:
    'https://raw.githubusercontent.com/valora-inc/dapp-list/main/translations/valora-dapp-list-base.json',
  maxNumRecentDapps: 4,
  skipVerification: false,
  showPriceChangeIndicatorInBalances: false,
  paymentDeepLinkHandler: PaymentDeepLinkHandler.Disabled,
  dappsWebViewEnabled: true,
  skipProfilePicture: false,
  celoWithdrawalEnabledInExchange: true,
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: true,
  dappConnectInfo: DappConnectInfo.Basic,
  visualizeNFTsEnabledInHomeAssetsPage: false,
  coinbasePayEnabled: false,
  showSwapMenuInDrawerMenu: false,
  shouldShowRecoveryPhraseInSettings: false,
  createAccountCopyTestType: CreateAccountCopyTestType.Account,
  maxSwapSlippagePercentage: 2,
  inviteMethod: InviteMethodType.Escrow,
  showGuidedOnboardingCopy: false,
  centralPhoneVerificationEnabled: false,
  networkTimeoutSeconds: 30,
}
