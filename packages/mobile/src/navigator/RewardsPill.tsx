import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { rewardsEnabledSelector, superchargeButtonSelector } from 'src/app/selectors'
import { SuperchargeButton } from 'src/app/types'
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
  const superchargeButton = useSelector(superchargeButtonSelector)

  if (
    !rewardsEnabled ||
    ![SuperchargeButton.PillRewards, SuperchargeButton.PillSupercharge].includes(superchargeButton)
  ) {
    return null
  }
  return (
    <TouchableOpacity style={styles.rewardsContainer} onPress={onOpenRewards} testID="EarnRewards">
      {superchargeButton === SuperchargeButton.PillRewards ? <Rings /> : <Supercharge />}
      <Text style={styles.earnRewardsText}>
        {superchargeButton === SuperchargeButton.PillRewards ? t('rewards') : t('supercharge')}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.greenBackground,
  },
  earnRewardsText: {
    ...fontStyles.small,
    color: colors.greenStrong,
    marginLeft: 5,
  },
})

export default RewardsPill
