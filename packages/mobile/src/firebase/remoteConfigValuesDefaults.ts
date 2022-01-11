import { RemoteConfigValues } from 'src/app/saga'
import { DEFAULT_SENTRY_TRACES_SAMPLE_RATE, SENTRY_ENABLED } from 'src/config'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  'showRaiseDailyLimitTarget' | 'celoEducationUri' | 'komenciAllowedDeployers' | 'dappListApiUri'
> & { komenciAllowedDeployers: string } = {
  hideVerification: false,
  // cannot set defaults to undefined or null
  // TODO: maybe a better default is '0xf' ?
  // showRaiseDailyLimitTarget: undefined,
  // same here
  // celoEducationUri: null,
  // dappListApiUri: null,
  celoEuroEnabled: true,
  inviteRewardsEnabled: false,
  inviteRewardCusd: 5,
  inviteRewardWeeklyLimit: 20,
  walletConnectV1Enabled: true,
  walletConnectV2Enabled: false,
  rewardsABTestThreshold: '0xffffffffffffffffffffffffffffffffffffffff',
  rewardsPercent: 50,
  rewardsStartDate: 1622505600000,
  rewardsMax: 1000,
  rewardsMin: 10,
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
  logPhoneNumberTypeEnabled: false,
  multiTokenShowHomeBalances: true,
  multiTokenUseSendFlow: false,
  multiTokenUseUpdatedFeed: false,
  allowOtaTranslations: false,
  linkBankAccountEnabled: false,
  sentryTracesSampleRate: DEFAULT_SENTRY_TRACES_SAMPLE_RATE,
  sentryEnabled: SENTRY_ENABLED,
  biometryEnabled: false,
}
