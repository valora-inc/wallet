import React from 'react'
import { useTranslation } from 'react-i18next'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { rewardsEnabledSelector, superchargeButtonTypeSelector } from 'src/app/selectors'
import { SuperchargeButtonType } from 'src/app/types'
import Pill from 'src/components/Pill'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import Rings from 'src/icons/Rings'
import Supercharge from 'src/icons/Supercharge'
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
  const superchargeButton = useSelector(superchargeButtonTypeSelector)

  if (
    !rewardsEnabled ||
    ![SuperchargeButtonType.PillRewards, SuperchargeButtonType.PillSupercharge].includes(
      superchargeButton
    )
  ) {
    return null
  }
  return (
    <Pill
      text={
        superchargeButton === SuperchargeButtonType.PillRewards ? t('rewards') : t('supercharge')
      }
      icon={superchargeButton === SuperchargeButtonType.PillRewards ? <Rings /> : <Supercharge />}
      onPress={onOpenRewards}
      testID="EarnRewards"
    />
  )
}

export default RewardsPill
