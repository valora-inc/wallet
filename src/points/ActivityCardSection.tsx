import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Celebration from 'src/icons/Celebration'
import RushingClock from 'src/icons/RushingClock'
import SwapArrows from 'src/icons/SwapArrows'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ActivityCard, { Props as ActivityCardProps } from 'src/points/ActivityCard'
import { BottomSheetParams, PointsActivity } from 'src/points/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  pointsActivities: PointsActivity[]
  onCardPress: (bottomSheetDetails: BottomSheetParams) => void
}

export default function ActivityCardSection({ pointsActivities, onCardPress }: Props) {
  const { t } = useTranslation()

  function mapActivityToCardProps(activity: PointsActivity): ActivityCardProps {
    switch (activity.activityId) {
      case 'create-wallet':
        return {
          ...activity,
          title: t('points.activityCards.createWallet.title'),
          icon: <Celebration />,
        }
      case 'swap':
        return {
          ...activity,
          title: t('points.activityCards.swap.title'),
          icon: <SwapArrows />,
          onPress: () =>
            onCardPress({
              ...activity,
              title: t('points.activityCards.swap.bottomSheet.title'),
              body: t('points.activityCards.swap.bottomSheet.body', {
                pointsValue: activity.pointsAmount,
              }),
              cta: {
                text: t('points.activityCards.swap.bottomSheet.cta'),
                onPress: () => {
                  navigate(Screens.SwapScreenWithBack)
                },
              },
            }),
        }
      default:
        // To catch any missing cases at compile time
        const assertNever: never = activity.activityId
        return assertNever
    }
  }

  const preparedActivities = pointsActivities.map(mapActivityToCardProps).sort(sortByAmountAndTitle)

  const incompleteActivities = preparedActivities.filter(({ completed }) => !completed)
  const completedActivities = preparedActivities.filter(({ completed }) => completed)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('points.activitySection.title')}</Text>
      <Text style={styles.body}>{t('points.activitySection.body')}</Text>
      <View style={styles.cardsContainer}>
        {incompleteActivities.map(renderActivityCard)}
        <MoreComingCard />
        {completedActivities.map(renderActivityCard)}
      </View>
    </View>
  )
}

function MoreComingCard() {
  const { t } = useTranslation()

  return (
    <View style={styles.moreComingCard}>
      <RushingClock />
      <Text style={styles.moreComingTitle}>{t('points.activityCards.moreComing.title')}</Text>
    </View>
  )
}

function renderActivityCard(props: ActivityCardProps) {
  return <ActivityCard key={props.activityId} {...props} />
}

const sortByAmountAndTitle = (a: ActivityCardProps, b: ActivityCardProps) => {
  const aPointsAmount = a.pointsAmount ?? 0
  const bPointsAmount = b.pointsAmount ?? 0
  const aPreviousPointsAmount = a.previousPointsAmount ?? 0
  const bPreviousPointsAmount = b.previousPointsAmount ?? 0

  // sort by decreasing points amount
  if (bPointsAmount !== aPointsAmount) {
    return bPointsAmount - aPointsAmount
  }

  // within the same points amount, promote the maximum increase from previous value
  const diffA = aPointsAmount - aPreviousPointsAmount
  const diffB = bPointsAmount - bPreviousPointsAmount
  if (diffB !== diffA) {
    return diffB - diffA
  }

  // finally, sort alphabetically
  return a.title.localeCompare(b.title)
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: Spacing.Small12,
  },
  cardsContainer: {
    gap: Spacing.Regular16,
    marginTop: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  body: {
    ...typeScale.bodyXSmall,
    color: Colors.gray3,
    marginTop: Spacing.Tiny4,
  },
  moreComingTitle: {
    ...typeScale.labelSmall,
  },
  moreComingCard: {
    backgroundColor: Colors.gray1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
    gap: Spacing.Smallest8,
  },
})
