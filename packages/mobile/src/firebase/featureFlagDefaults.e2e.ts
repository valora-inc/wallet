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
  celoEuroEnabled: true,
  shortVerificationCodesEnabled: true,
  inviteRewardsEnabled: false,
  inviteRewardCusd: 1,
  inviteRewardWeeklyLimit: 20,
  walletConnectV1Enabled: false,
  walletConnectV2Enabled: false,
  rewardsABTestThreshold: '0xffffffffffffffffffffffffffffffffffffffff',
  rewardsPercent: 5,
  rewardsStartDate: 1622505600000,
  rewardsMax: 1000,
  rewardsMin: 10,
  komenciUseLightProxy: false,
  komenciAllowedDeployers:
    '0xbDb92Ca42559adc5adC20a1E4985dC7c476483be,0x4cda887Bce324109535814D49b74c6a560fAe1D9',
  pincodeUseExpandedBlocklist: true,
  rewardPillText: JSON.stringify({ en: 'Earn', pt: 'Ganhar', es: 'Gana' }),
  cashInButtonExpEnabled: false,
  logPhoneNumberTypeEnabled: false,
  multiTokenShowHomeBalances: false,
  multiTokenUseSendFlow: false,
  multiTokenUseUpdatedFeed: false,
}
