import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { rewardPillTextSelector, rewardsEnabledSelector } from 'src/app/selectors'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import i18n from 'src/i18n'
import Rings from 'src/icons/Rings'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'

function RewardsPill() {
  const onOpenRewards = () => {
    navigate(Screens.ConsumerIncentivesHomeScreen)
    ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
      origin: RewardsScreenOrigin.RewardPill,
    })
  }

  const rewardsEnabled = useSelector(rewardsEnabledSelector)
  const rewardPillText = useSelector(rewardPillTextSelector)

  if (!rewardsEnabled) {
    return null
  }
  return (
    <TouchableOpacity style={styles.rewardsContainer} onPress={onOpenRewards} testID="EarnRewards">
      <Rings />
      <Text style={styles.earnRewardsText}>
        {rewardPillText ? getContentForCurrentLang(rewardPillText) : i18n.t('global:earn')}
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
