import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import Touchable from 'src/components/Touchable'
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
          <DataUp color={Colors.primary} testID="SafetyCard/RiskPositive" />
        ) : (
          <DataDown color={Colors.error} testID="SafetyCard/RiskNegative" />
        )}
      </View>
      <View>
        <Text style={styles.riskTitle}>{risk.title}</Text>
        <Text style={styles.riskCategory}>{risk.category}</Text>
      </View>
    </View>
  )
}

export function SafetyCard({ safety }: { safety: Safety }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = React.useState(false)
  return (
    <View style={styles.card} testID="SafetyCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <LabelWithInfo
            onPress={() => {
              // todo(act-1405): open bottom sheet
            }}
            label={t('earnFlow.poolInfoScreen.safetyScore')}
            labelStyle={styles.cardTitleText}
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
        style={styles.cardLineContainer}
        onPress={() => {
          setExpanded((prev) => !prev)
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
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 12,
    gap: Spacing.Regular16,
  },
  cardLineContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  cardTitleText: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  cardLineLabel: {
    paddingRight: 20, // Prevents Icon from being cut off on long labels
  },
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
    backgroundColor: Colors.primary,
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
