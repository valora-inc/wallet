import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import Touchable from 'src/components/Touchable'
import { pointsCardBackground } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { pointsBalanceSelector, pointsIntroHasBeenDismissedSelector } from 'src/points/selectors'
import { pointsDataRefreshStarted } from 'src/points/slice'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function PointsDiscoverCard() {
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)
  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)

  const dispatch = useDispatch()
  const { t } = useTranslation()
  const pointsBalance = useSelector(pointsBalanceSelector)
  const pointsIntroHasBeenDismissed = useSelector(pointsIntroHasBeenDismissedSelector)

  const handlePress = () => {
    AppAnalytics.track(PointsEvents.points_discover_press)
    if (pointsIntroHasBeenDismissed) {
      navigate(Screens.PointsHome)
    } else {
      navigate(Screens.PointsIntro)
    }
  }

  useEffect(() => {
    dispatch(pointsDataRefreshStarted())
  }, [])

  if (!showPoints || showUKCompliantVariant) {
    return null
  }

  return (
    <Touchable
      shouldRenderRippleAbove
      style={styles.touchable}
      borderRadius={Spacing.Smallest8}
      onPress={handlePress}
      testID="PointsDiscoverCard"
    >
      <>
        <Image style={styles.image} source={pointsCardBackground} />
        <View style={styles.content}>
          <Text style={styles.title}>{t('points.discoverCard.title')}</Text>
          <Text style={styles.description}>{t('points.discoverCard.description')}</Text>
          <LinearGradient
            colors={[Colors.gradientBorderLeft, Colors.gradientBorderRight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.linearGradient}
          >
            <View style={styles.innerContainer}>
              <Text style={styles.balance}>
                {t('points.discoverCard.balance', { pointsBalance })}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  touchable: {
    overflow: 'hidden',
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: Spacing.Smallest8,
    marginBottom: Spacing.Thick24,
  },
  image: {
    width: '100%',
    height: 56,
  },
  content: {
    paddingTop: Spacing.Smallest8,
    paddingHorizontal: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
    marginBottom: Spacing.Smallest8,
  },
  description: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
  balance: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  linearGradient: {
    height: 40,
    borderRadius: 50,
    alignSelf: 'flex-start',
    marginTop: Spacing.Regular16,
    pointerEvents: 'none',
  },
  innerContainer: {
    borderRadius: 50,
    flex: 1,
    margin: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    paddingHorizontal: Spacing.Small12,
    paddingVertical: 6,
  },
})
