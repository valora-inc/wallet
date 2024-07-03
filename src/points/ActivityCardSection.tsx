import React from 'react'
import ActivityCard from 'src/points/ActivityCard'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import LogoHeart from 'src/icons/LogoHeart'
import { BottomSheetParams, PointsMetadata, isPointsActivityId } from 'src/points/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  onCardPress: (bottomSheetDetails: BottomSheetParams) => void
  pointsSections: PointsMetadata[]
}

export default function ActivityCardSection({ onCardPress, pointsSections }: Props) {
  const { t } = useTranslation()

  function makeSection(pointsMetadata: PointsMetadata, sectionIndex: number): React.ReactNode {
    const pointsAmount = pointsMetadata.pointsAmount

    const cards = pointsMetadata.activities
      .filter((activity) => isPointsActivityId(activity.activityId))
      .map((activity) => (
        <ActivityCard
          key={activity.activityId}
          activityId={activity.activityId}
          pointsAmount={pointsAmount}
          onPress={onCardPress}
        />
      ))

    // add the "more coming" card to the last section
    if (sectionIndex === pointsSections.length - 1) {
      cards.push(
        <ActivityCard
          key="more-coming"
          activityId="more-coming"
          pointsAmount={pointsAmount}
          onPress={onCardPress}
        />
      )
    }

    if (!cards.length) {
      return <View key={pointsAmount}></View>
    }

    return (
      <View
        testID={`PointsActivitySection-${pointsAmount}`}
        key={pointsAmount}
        style={styles.pointsSection}
      >
        <View style={styles.pointsSectionHeader}>
          <View style={styles.hr} />
          <View style={styles.pointsSectionHeaderAmountContainer}>
            <Text style={styles.pointsSectionHeaderAmount}>{pointsAmount}</Text>
            <LogoHeart size={16} />
          </View>
          <View style={styles.hr} />
        </View>
        <View style={styles.pointsSectionContent}>{cards}</View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t('points.activitySection.title')}</Text>
        <Text style={styles.body}>{t('points.activitySection.body')}</Text>
      </View>
      {pointsSections.map(makeSection)}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: Spacing.Small12,
  },
  hr: {
    flexGrow: 1,
    marginHorizontal: Spacing.Smallest8,
    borderColor: Colors.gray2,
    borderBottomWidth: 1,
  },
  pointsSectionHeaderAmountContainer: {
    borderWidth: 1,
    borderColor: Colors.gray2,
    paddingHorizontal: Spacing.Small12,
    paddingVertical: Spacing.Tiny4,
    borderRadius: Spacing.XLarge48,
    flexDirection: 'row',
    gap: Spacing.Tiny4,
  },
  pointsSectionHeaderAmount: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.successDark,
  },
  pointsSectionHeader: {
    flexDirection: 'row',
    flexGrow: 1,
    alignItems: 'center',
  },
  pointsSectionContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  textContainer: {
    padding: Spacing.Regular16,
    paddingBottom: 0,
  },
  pointsSection: {
    margin: Spacing.Smallest8,
    marginTop: 0,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    marginBottom: Spacing.Tiny4,
  },
  body: {
    ...typeScale.bodyXSmall,
    color: Colors.gray3,
    marginBottom: Spacing.Thick24,
  },
})
