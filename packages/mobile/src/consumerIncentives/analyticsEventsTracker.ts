import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'

export enum RewardsScreenOrigin {
  RewardPill = 'RewardPill',
  NotificationBox = 'NotificationBox',
  PaymentDetail = 'PaymentDetail',
  PushNotification = 'PushNotification',
}

export enum RewardsScreenCta {
  CashIn = 'CashIn',
  VerifyPhone = 'VerifyPhone',
}

export const trackRewardsScreenOpenEvent = (uri: string, origin: RewardsScreenOrigin) => {
  if (uri.includes(Screens.ConsumerIncentivesHomeScreen)) {
    ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
      origin,
    })
  }
}
