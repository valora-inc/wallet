import React from 'react'
import Touchable from 'src/components/Touchable'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from 'src/styles/colors'
import Checkmark from 'src/icons/Checkmark'
import { PointsActivity, BottomSheetMetadata, BottomSheetParams } from 'src/points/types'
import useCardDefinitions from 'src/points/cardDefinitions'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PointsEvents } from 'src/analytics/Events'

interface Props {
  activity: PointsActivity
  points: number
  onPress: (bottomSheetParams: BottomSheetParams) => void
  completed?: boolean
}

export default function ActivityCard({ activity, points, onPress, completed }: Props) {
  const cardDefinition = useCardDefinitions(points)[activity]

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

  const cardStyle = {
    ...styles.card,
    opacity: isCompleted ? 0.5 : 1,
  }
  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Touchable
          testID={`PointsActivityCard-${activity}-${points}`}
          style={cardStyle}
          onPress={
            cardDefinition.bottomSheet ? onPressWrapper(cardDefinition.bottomSheet) : undefined
          }
          disabled={!cardDefinition.bottomSheet}
          borderRadius={Spacing.Regular16}
        >
          <>
            {isCompleted && (
              <View style={styles.checkmarkIcon}>
                <Checkmark height={12} width={12} color={Colors.black} stroke={true} />
              </View>
            )}
            {cardDefinition.icon}
            <Text style={styles.cardTitle}>{cardDefinition.title}</Text>
          </>
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexBasis: '50%',
    padding: Spacing.Smallest8,
  },
  checkmarkIcon: {
    position: 'absolute',
    top: Spacing.Smallest8,
    right: Spacing.Smallest8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.black,
  },
  cardTitle: {
    ...typeScale.labelXSmall,
    paddingTop: Spacing.Smallest8,
    textAlign: 'center',
  },
  cardContainer: {
    borderRadius: Spacing.Regular16,
    backgroundColor: Colors.gray1,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Regular16,
    minHeight: 96,
  },
})
