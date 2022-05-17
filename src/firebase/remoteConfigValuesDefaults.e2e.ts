import { RemoteConfigValues } from 'src/app/saga'
import { SuperchargeButtonType } from 'src/app/types'
import { PaymentDeepLinkHandler } from 'src/merchantPayment/types'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  | 'showRaiseDailyLimitTarget'
  | 'celoEducationUri'
  | 'komenciAllowedDeployers'
  | 'sentryNetworkErrors'
  | 'superchargeTokens'
  | 'finclusiveUnsupportedStates'
> & {
  komenciAllowedDeployers: string
  sentryNetworkErrors: string
  superchargecUSDMin: number
  superchargecUSDMax: number
  finclusiveUnsupportedStates: string
} = {
  hideVerification: false,
  // cannot set defaults to undefined or null
  // TODO: maybe a better default is '0xf' ?
  // showRaiseDailyLimitTarget: undefined,
  // same here
  // celoEducationUri: null,
  celoEuroEnabled: true,
  inviteRewardsEnabled: false,
  inviteRewardCusd: 1,
  inviteRewardWeeklyLimit: 20,
  walletConnectV1Enabled: true,
  walletConnectV2Enabled: false,
  superchargeApy: 25,
  superchargecUSDMin: 10,
  superchargecUSDMax: 1000,
  komenciUseLightProxy: false,
  komenciAllowedDeployers:
    '0xbDb92Ca42559adc5adC20a1E4985dC7c476483be,0x4cda887Bce324109535814D49b74c6a560fAe1D9',
  pincodeUseExpandedBlocklist: true,
  rewardPillText: JSON.stringify({ en: 'Earn', pt: 'Ganhar', es: 'Gana' }),
  cashInButtonExpEnabled: false,
  rampCashInButtonExpEnabled: false,
  logPhoneNumberTypeEnabled: false,
  allowOtaTranslations: false,
  linkBankAccountEnabled: false,
  linkBankAccountStepTwoEnabled: false,
  sentryTracesSampleRate: 0.2,
  sentryNetworkErrors: '',
  biometryEnabled: false,
  dappListApiUrl:
    'https://raw.githubusercontent.com/valora-inc/dapp-list/main/translations/valora-dapp-list-base.json',
  superchargeButtonType: SuperchargeButtonType.PillRewards,
  maxNumRecentDapps: 4,
  skipVerification: false,
  showPriceChangeIndicatorInBalances: false,
  paymentDeepLinkHandler: PaymentDeepLinkHandler.Disabled,
  dappsWebViewEnabled: true,
  skipProfilePicture: false,
  finclusiveUnsupportedStates: 'NY,TX',
  celoWithdrawalEnabledInExchange: true,
}
