import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { EarnCommonProperties } from 'src/analytics/Properties'
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import Touchable from 'src/components/Touchable'
import { styles as cardStyles } from 'src/earn/poolInfoScreen/Cards'
import DataDown from 'src/icons/DataDown'
import DataUp from 'src/icons/DataUp'
import { Safety, SafetyRisk } from 'src/positions/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const BAR_HEIGHTS = [8, 13, 18]

const LEVEL_TO_MAX_HIGHLIGHTED_BAR: Record<Safety['level'], 1 | 2 | 3> = {
  low: 1,
  medium: 2,
  high: 3,
}

function Risk({ risk }: { risk: SafetyRisk }) {
  return (
    <View style={styles.riskContainer} testID="SafetyCard/Risk">
      <View style={styles.icon}>
        {risk.isPositive ? (
          <DataUp color={Colors.accent} testID="SafetyCard/RiskPositive" />
        ) : (
          <DataDown color={Colors.error} testID="SafetyCard/RiskNegative" />
        )}
      </View>
      <View style={styles.riskTextContainer}>
        <Text style={styles.riskTitle}>{risk.title}</Text>
        <Text style={styles.riskCategory}>{risk.category}</Text>
      </View>
    </View>
  )
}

export function SafetyCard({
  safety,
  commonAnalyticsProps,
  onInfoIconPress,
}: {
  safety: Safety
  commonAnalyticsProps: EarnCommonProperties
  onInfoIconPress: () => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = React.useState(false)
  return (
    <View style={cardStyles.card} testID="SafetyCard">
      <View style={cardStyles.cardLineContainer}>
        <View style={cardStyles.cardLineLabel}>
          <LabelWithInfo
            onPress={onInfoIconPress}
            label={t('earnFlow.poolInfoScreen.safetyScore')}
            labelStyle={cardStyles.cardTitleText}
            testID="SafetyCardInfoIcon"
          />
        </View>
        <View style={styles.tripleBarContainer}>
          {BAR_HEIGHTS.map((height, index) => (
            <View
              testID="SafetyCard/Bar"
              key={index}
              style={[
                styles.bar,
                { height },
                index < LEVEL_TO_MAX_HIGHLIGHTED_BAR[safety.level] && styles.barHighlighted,
              ]}
            />
          ))}
        </View>
      </View>
      {expanded && (
        <View style={styles.risksContainer}>
          {safety.risks.map((risk, index) => (
            <Risk key={`risk-${index}`} risk={risk} />
          ))}
        </View>
      )}
      <Touchable
        testID="SafetyCard/ViewDetails"
        style={cardStyles.cardLineContainer}
        onPress={() => {
          setExpanded((prev) => !prev)
          AppAnalytics.track(EarnEvents.earn_pool_info_tap_safety_details, {
            action: expanded ? 'collapse' : 'expand',
            ...commonAnalyticsProps,
          })
        }}
      >
        <Text style={styles.viewDetailsText}>
          {expanded
            ? t('earnFlow.poolInfoScreen.viewLessDetails')
            : t('earnFlow.poolInfoScreen.viewMoreDetails')}
        </Text>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  tripleBarContainer: {
    flex: 1,
    gap: 2,
    flexDirection: 'row',
    paddingHorizontal: Spacing.Tiny4,
    alignItems: 'flex-end',
    paddingBottom: 3,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 4,
    backgroundColor: Colors.gray2,
  },
  barHighlighted: {
    backgroundColor: Colors.accent,
  },
  viewDetailsText: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.gray3,
    textAlign: 'center',
    flex: 1,
  },
  risksContainer: {
    gap: Spacing.Thick24,
  },
  riskContainer: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  riskTextContainer: {
    flex: 1,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskTitle: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  riskCategory: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
})
