import { RewardsEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { Screens } from 'src/navigator/Screens'

export enum RewardsScreenOrigin {
  RewardPill = 'RewardPill',
  NotificationBox = 'NotificationBox',
  RewardAvailableNotification = 'RewardAvailableNotification',
  PaymentDetail = 'PaymentDetail',
  PushNotification = 'PushNotification',
  SuperchargingNotification = 'SuperchargingNotification',
  StartSuperchargingNotification = 'StartSuperchargingNotification',
}

export enum RewardsScreenCta {
  ClaimRewards = 'ClaimRewards',
  CashIn = 'CashIn',
  VerifyPhone = 'VerifyPhone',
}

export const trackRewardsScreenOpenEvent = (uri: string, origin: RewardsScreenOrigin) => {
  if (uri.includes(Screens.ConsumerIncentivesHomeScreen)) {
    AppAnalytics.track(RewardsEvents.rewards_screen_opened, {
      origin,
    })
  }
}
