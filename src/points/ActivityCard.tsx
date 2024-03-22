import React from 'react'
import Touchable from 'src/components/Touchable'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from 'src/styles/colors'
import CheckmarkWithCircleBorder from 'src/icons/CheckmarkWithCircleBorder'
import { PointsActivities, BottomSheetMetadata, BottomSheetParams } from 'src/points/types'
import cardDefinitions from 'src/points/cardDefinitions'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import { useTranslation } from 'react-i18next'

interface Props {
  activity: PointsActivities
  points: number
  onPress: (bottomSheetParams: BottomSheetParams) => void
  completed?: boolean
}

export default function ActivityCard({ activity, points, onPress, completed }: Props) {
  const { t } = useTranslation()

  const cardDefinition = cardDefinitions[activity]
  const isCompleted = completed !== undefined ? completed : cardDefinition.defaultCompletionStatus

  const onPressWrapper = (bottomSheetMetadata: BottomSheetMetadata) => {
    return () => {
      ValoraAnalytics.track(PointsEvents.points_screen_card_press, {
        activity,
      })
      onPress({
        ...bottomSheetMetadata,
        points,
        activity,
      })
    }
  }

  const testID = `PointsActivityCard-${activity}-${points}`

  const cardContent = (
    <>
      {isCompleted && (
        <View style={styles.checkmarkIcon}>
          <CheckmarkWithCircleBorder />
        </View>
      )}
      {cardDefinition.icon}
      <Text style={styles.cardTitle}>{t(cardDefinition.title)}</Text>
    </>
  )

  const cardContainerStyle = {
    ...styles.cardContainer,
    ...(isCompleted ? { opacity: 0.5 } : {}),
  }
  const cardContainer = cardDefinition.bottomSheet ? (
    <Touchable
      testID={testID}
      style={cardContainerStyle}
      onPress={onPressWrapper(cardDefinition.bottomSheet)}
    >
      {cardContent}
    </Touchable>
  ) : (
    <View testID={testID} style={cardContainerStyle}>
      {cardContent}
    </View>
  )

  return <View style={styles.container}>{cardContainer}</View>
}

const styles = StyleSheet.create({
  container: {
    flexBasis: '50%',
    padding: Spacing.Smallest8,
  },
  checkmarkIcon: {
    position: 'absolute',
    top: Spacing.Smallest8,
    right: 0,
  },
  cardTitle: {
    ...typeScale.labelXSmall,
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    borderRadius: Spacing.Regular16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Regular16,
    backgroundColor: Colors.gray1,
    height: 96,
  },
})
