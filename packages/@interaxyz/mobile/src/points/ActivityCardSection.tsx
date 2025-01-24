import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Celebration from 'src/icons/Celebration'
import EarnCoins from 'src/icons/EarnCoins'
import MagicWand from 'src/icons/MagicWand'
import SwapArrows from 'src/icons/SwapArrows'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ActivityCard, { Props as ActivityCardProps, MoreComingCard } from 'src/points/ActivityCard'
import { compareAmountAndTitle } from 'src/points/cardSort'
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
      case 'create-live-link':
        return {
          ...activity,
          title: t('points.activityCards.createLiveLink.title'),
          icon: <MagicWand color={Colors.black} />,
          onPress: () =>
            onCardPress({
              ...activity,
              title: t('points.activityCards.createLiveLink.bottomSheet.title'),
              body: t('points.activityCards.createLiveLink.bottomSheet.body', {
                pointsValue: activity.pointsAmount,
              }),
              cta: {
                text: t('points.activityCards.createLiveLink.bottomSheet.cta'),
                onPress: () => {
                  navigate(Screens.JumpstartEnterAmount)
                },
              },
            }),
        }
      case 'deposit-earn':
        return {
          ...activity,
          title: t('points.activityCards.depositEarn.title'),
          icon: <EarnCoins color={Colors.black} />,
          onPress: () =>
            onCardPress({
              ...activity,
              title: t('points.activityCards.depositEarn.bottomSheet.title'),
              body: t('points.activityCards.depositEarn.bottomSheet.body', {
                pointsValue: activity.pointsAmount,
              }),
              cta: {
                text: t('points.activityCards.depositEarn.bottomSheet.cta'),
                onPress: () => {
                  navigate(Screens.EarnHome)
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

  const { incompleteActivities, completedActivities } = React.useMemo(() => {
    const sortedActivities = pointsActivities
      .map(mapActivityToCardProps)
      .sort(compareAmountAndTitle)

    const incompleteActivities = sortedActivities.filter(({ completed }) => !completed)
    const completedActivities = sortedActivities.filter(({ completed }) => completed)

    return { incompleteActivities, completedActivities }
  }, [pointsActivities])

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

function renderActivityCard(props: ActivityCardProps) {
  return <ActivityCard key={props.activityId} {...props} />
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
})
