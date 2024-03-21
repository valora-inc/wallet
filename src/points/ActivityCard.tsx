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
  const containerStyle = {
    ...styles.cardContainer,
    ...(completed ? { opacity: 0.5 } : {}),
  }

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

  const isCompleted = completed !== undefined ? completed : cardDefinition.defaultCompletionStatus

  const testID = `PointsActivityCard-${activity}-${points}`

  const content = (
    <View style={containerStyle}>
      {isCompleted && (
        <View style={styles.checkmarkIcon}>
          <CheckmarkWithCircleBorder />
        </View>
      )}
      {cardDefinition.icon}
      <Text style={styles.cardTitle}>{t(cardDefinition.title)}</Text>
    </View>
  )
  if (cardDefinition.bottomSheet) {
    return (
      <Touchable
        testID={testID}
        style={styles.container}
        onPress={onPressWrapper(cardDefinition.bottomSheet)}
      >
        {content}
      </Touchable>
    )
  } else {
    return (
      <View testID={testID} style={styles.container}>
        {content}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: Spacing.Regular16,
    margin: Spacing.Smallest8,
    backgroundColor: Colors.gray1,
    height: 96,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Regular16,
  },
})
