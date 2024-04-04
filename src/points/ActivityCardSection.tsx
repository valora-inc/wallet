import React from 'react'
import { isPointsActivity } from 'src/points/types'
import ActivityCard from 'src/points/ActivityCard'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StyleSheet, Text, View } from 'react-native'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Colors } from 'src/styles/colors'
import { useTranslation } from 'react-i18next'
import { PointsMetadata } from 'src/points/types'
import { BottomSheetParams } from 'src/points/types'

interface Props {
  onCardPress: (bottomSheetDetails: BottomSheetParams) => void
}

export default function ActivityCardSection({ onCardPress }: Props) {
  const { t } = useTranslation()

  const pointsConfig = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.POINTS_CONFIG])

  function makeSection(pointsMetadata: PointsMetadata): React.ReactNode {
    const points = pointsMetadata.points

    const cards = pointsMetadata.activities
      .filter((activity) => isPointsActivity(activity.name))
      .map((activity) => (
        <ActivityCard
          key={activity.name}
          activity={activity.name}
          points={points}
          onPress={onCardPress}
        />
      ))

    if (!cards.length) {
      return <View key={points}></View>
    }

    return (
      <View testID={`PointsActivitySection-${points}`} key={points} style={styles.pointsSection}>
        <View style={styles.pointsSectionHeader}>
          <View style={styles.hr} />
          <View style={styles.pointsSectionHeaderAmountContainer}>
            <Text style={styles.pointsSectionHeaderAmount}>{points}</Text>
          </View>
          <View style={styles.hr} />
        </View>
        <View style={styles.pointsSectionContent}>{cards}</View>
      </View>
    )
  }

  const sortedSections = pointsConfig.pointsMetadata
    .sort((a, b) => {
      if (a.points < b.points) return 1
      if (a.points > b.points) return -1
      return 0
    })
    .filter((metadata) => metadata.points)
    .map(makeSection)

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t('points.activitySection.title')}</Text>
        <Text style={styles.body}>{t('points.activitySection.body')}</Text>
      </View>
      {sortedSections}
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
    borderRadius: Spacing.XLarge48,
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
