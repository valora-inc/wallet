import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import Touchable from 'src/components/Touchable'
import CheckCircle from 'src/icons/CheckCircle'
import ComingSoon from 'src/icons/ComingSoon'
import LogoHeart from 'src/images/LogoHeart'
import { PointsActivity } from 'src/points/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export interface Props extends PointsActivity {
  title: string
  icon: ReactNode
  onPress?: () => void
}

export default function ActivityCard({
  activityId,
  pointsAmount,
  previousPointsAmount,
  completed = false,
  title,
  icon,
  onPress,
}: Props) {
  const handleOnPress = () => {
    AppAnalytics.track(PointsEvents.points_screen_card_press, { activityId })
    onPress?.()
  }

  return (
    <Touchable
      testID={`ActivityCard/${activityId}`}
      style={[styles.card, completed && styles.faded]}
      borderRadius={Spacing.Smallest8}
      disabled={completed}
      onPress={handleOnPress}
    >
      <>
        {completed ? <CheckCircle testID="CheckCircleIcon" /> : icon}
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.pointsAmountContainer}>
          <Text style={styles.previousPointsAmount}>{previousPointsAmount}</Text>
          <Text style={styles.pointsAmount}>{pointsAmount}</Text>
          <LogoHeart size={Spacing.Regular16} />
        </View>
      </>
    </Touchable>
  )
}

export function MoreComingCard() {
  const { t } = useTranslation()

  return (
    <View style={styles.card}>
      <ComingSoon />
      <Text style={styles.cardTitle}>{t('points.activityCards.moreComing.title')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  cardTitle: {
    flex: 1,
    ...typeScale.labelSmall,
  },
  card: {
    backgroundColor: Colors.gray1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
    gap: Spacing.Smallest8,
    borderRadius: Spacing.Smallest8,
  },
  faded: {
    opacity: 0.5,
  },
  pointsAmountContainer: {
    marginLeft: 'auto',
    flexDirection: 'row',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray2,
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
    gap: Spacing.Tiny4,
  },
  pointsAmount: {
    ...typeScale.labelXSmall,
    color: Colors.black,
  },
  previousPointsAmount: {
    ...typeScale.labelXSmall,
    color: Colors.gray3,
    textDecorationLine: 'line-through',
  },
})
