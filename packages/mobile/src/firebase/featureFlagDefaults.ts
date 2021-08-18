import { RemoteFeatureFlags } from 'src/app/saga'

export const FEATURE_FLAG_DEFAULTS: Omit<
  RemoteFeatureFlags,
  'showRaiseDailyLimitTarget' | 'celoEducationUri' | 'komenciAllowedDeployers'
> & { komenciAllowedDeployers: string } = {
  hideVerification: false,
  // cannot set defaults to undefined or null
  // TODO: maybe a better default is '0xf' ?
  // showRaiseDailyLimitTarget: undefined,
  // same here
  // celoEducationUri: null,
  celoEuroEnabled: false,
  shortVerificationCodesEnabled: false,
  inviteRewardsEnabled: false,
  inviteRewardCusd: 1,
  inviteRewardWeeklyLimit: 20,
  walletConnectEnabled: false,
  rewardsABTestThreshold: '0xffffffffffffffffffffffffffffffffffffffff',
  rewardsPercent: 5,
  rewardsStartDate: 1622505600000,
  rewardsMax: 1000,
  komenciUseLightProxy: false,
  komenciAllowedDeployers: '',
}
