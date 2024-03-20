import React from 'react'
import { PointsActivities } from 'src/points/types'
import CreateWallet from 'src/points/activityCards/CreateWallet'
import Swap from 'src/points/activityCards/Swap'
import MoreComing from 'src/points/activityCards/MoreComing'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StyleSheet, Text, View } from 'react-native'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Colors } from 'src/styles/colors'
import { useTranslation } from 'react-i18next'
import { PointsMetadata } from 'src/points/types'
import { BottomSheetDetails } from 'src/points/types'

const activityToCardMap = {
  [PointsActivities.CreateWallet]: CreateWallet,
  [PointsActivities.Swap]: Swap,
  [PointsActivities.MoreComing]: MoreComing,
}

interface Props {
  onCardPress: (bottomSheetDetails: BottomSheetDetails) => void
}

export default function ActivityCardSection({ onCardPress }: Props) {
  const { t } = useTranslation()

  const pointsConfig = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.POINTS_CONFIG])

  function makeSection(pointsMetadata: PointsMetadata): React.ReactNode {
    const points = pointsMetadata.points

    const cardPairs = pointsMetadata.activities
      .filter((activity) => activity.name in activityToCardMap)
      .reduce(
        (res, _val, i, arr) => {
          if (i % 2 === 0) res.push(arr.slice(i, i + 2))
          return res
        },
        [] as (typeof pointsMetadata.activities)[]
      )
      .map((activityPair, i) => {
        const singleActivity = !activityPair[1]
        const rowStyle = {
          ...styles.cardRow,
          maxWidth: singleActivity ? '50%' : '100%',
        }
        const params = {
          points,
          onPress: onCardPress,
        }
        return (
          <View key={i} style={rowStyle}>
            {activityToCardMap[activityPair[0].name](params)}
            {!singleActivity && activityToCardMap[activityPair[1].name](params)}
          </View>
        )
      })
    return (
      <View testID={`PointsActivitySection-${points}`} key={points} style={styles.pointsSection}>
        <View style={styles.pointsSectionHeader}>
          <View style={styles.hr} />
          <View style={styles.pointsSectionHeaderAmountContainer}>
            <Text style={styles.pointsSectionHeaderAmount}>{points}</Text>
          </View>
          <View style={styles.hr} />
        </View>
        {cardPairs}
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
  textContainer: {
    padding: Spacing.Regular16,
    paddingBottom: 0,
  },
  pointsSection: {
    margin: Spacing.Smallest8,
    marginTop: 0,
  },
  cardRow: {
    flexDirection: 'row',
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
