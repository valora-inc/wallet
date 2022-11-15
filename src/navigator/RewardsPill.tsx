import React from 'react'
import { useTranslation } from 'react-i18next'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { rewardsEnabledSelector } from 'src/app/selectors'
import Pill from 'src/components/Pill'
import { isE2EEnv } from 'src/config'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import Rings from 'src/icons/Rings'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'

function RewardsPill() {
  const { t } = useTranslation()

  const onOpenRewards = () => {
    navigate(Screens.ConsumerIncentivesHomeScreen)
    ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
      origin: RewardsScreenOrigin.RewardPill,
    })
  }

  const rewardsEnabled = useSelector(rewardsEnabledSelector)
  const showRewardsPill = isE2EEnv || rewardsEnabled

  if (!showRewardsPill) {
    return null
  }
  return <Pill text={t('rewards')} icon={<Rings />} onPress={onOpenRewards} testID="EarnRewards" />
}

export default RewardsPill
