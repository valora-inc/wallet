import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import LogoHeart from 'src/icons/LogoHeart'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { pointsBalanceSelector, pointsIntroHasBeenDismissedSelector } from 'src/points/selectors'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function PointsDiscoverCard() {
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)

  const { t } = useTranslation()
  const pointsBalance = useSelector(pointsBalanceSelector)
  const pointsIntroHasBeenDismissed = useSelector(pointsIntroHasBeenDismissedSelector)

  const handlePress = () => {
    ValoraAnalytics.track(PointsEvents.points_discover_press)
    if (pointsIntroHasBeenDismissed) {
      navigate(Screens.PointsHome)
    } else {
      navigate(Screens.PointsIntro)
    }
  }

  if (!showPoints) {
    return null
  }

  return (
    <View style={styles.container}>
      <Touchable
        style={styles.touchable}
        borderRadius={Spacing.Smallest8}
        onPress={handlePress}
        testID="PointsDiscoverCard"
      >
        <>
          <View style={styles.header}>
            <Text style={styles.title}>{t('points.discoverCard.title')}</Text>
            <View style={styles.pill}>
              <Text style={styles.balance}>{pointsBalance}</Text>
              <LogoHeart size={Spacing.Regular16} />
            </View>
          </View>
          <Text style={styles.description}>{t('points.discoverCard.description')}</Text>
        </>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.Thick24,
  },
  touchable: {
    padding: Spacing.Regular16,
    gap: Spacing.Smallest8,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: Spacing.Smallest8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.Small12,
    paddingVertical: Spacing.Tiny4,
    gap: Spacing.Tiny4,
    backgroundColor: Colors.successLight,
    borderRadius: 100,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  description: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
  balance: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.successDark,
  },
})
