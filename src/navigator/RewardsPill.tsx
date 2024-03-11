import React from 'react'
import { useTranslation } from 'react-i18next'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { phoneNumberVerifiedSelector, rewardsEnabledSelector } from 'src/app/selectors'
import Pill from 'src/components/Pill'
import { isE2EEnv } from 'src/config'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import { superchargeInfoSelector } from 'src/consumerIncentives/selectors'
import ValoraV from 'src/icons/ValoraV'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'

function RewardsPill() {
  const { t } = useTranslation()

  const rewardsEnabled = useSelector(rewardsEnabledSelector)
  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const { hasBalanceForSupercharge } = useSelector(superchargeInfoSelector)
  const restrictSuperchargeForClaimOnly = getFeatureGate(
    StatsigFeatureGates.RESTRICT_SUPERCHARGE_FOR_CLAIM_ONLY
  )
  const isSupercharging = phoneNumberVerified && hasBalanceForSupercharge

  const onOpenRewards = () => {
    navigate(Screens.ConsumerIncentivesHomeScreen)
    ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
      origin: RewardsScreenOrigin.RewardPill,
    })
  }

  const hideRewardsPill =
    (restrictSuperchargeForClaimOnly && !isSupercharging) || (!isE2EEnv && !rewardsEnabled)

  if (hideRewardsPill) {
    return null
  }
  return (
    <Pill
      text={t('rewards')}
      icon={<ValoraV size={18} color={Colors.successDark} />}
      onPress={onOpenRewards}
      testID="EarnRewards"
      textColor={Colors.successDark}
    />
  )
}

export default RewardsPill
