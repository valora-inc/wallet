import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import LogoHeart from 'src/icons/LogoHeart'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { pointsBalanceSelector } from 'src/points/selectors'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  style?: StyleProp<ViewStyle>
}

export default function PointsDiscoverCard({ style }: Props) {
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)

  const { t } = useTranslation()
  const pointsBalance = useSelector(pointsBalanceSelector)

  const handlePress = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_open)
    navigate(Screens.PointsHome)
  }

  if (!showPoints) {
    return null
  }

  return (
    <Touchable onPress={handlePress} testID="PointsDiscoverCard">
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('points.discoverCard.title')}</Text>
          <View style={styles.pill}>
            <Text style={styles.balance}>{pointsBalance}</Text>
            <LogoHeart size={16} />
          </View>
        </View>
        <Text style={styles.description}>{t('points.discoverCard.description')}</Text>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    gap: Spacing.Smallest8,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: Spacing.Smallest8,
    marginBottom: Spacing.Thick24,
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
