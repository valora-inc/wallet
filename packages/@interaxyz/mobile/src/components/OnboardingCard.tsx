import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import ForwardChevron from 'src/icons/ForwardChevron'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'

interface Props {
  onPress?: () => void
  title: string
  subtitle: string
  testId?: string
}

function OnboardingCard({ testId, onPress, title, subtitle }: Props) {
  return (
    <Card testID="OnboardingCard" style={styles.card} rounded={true} shadow={Shadow.Soft}>
      <Touchable style={styles.pressableCard} onPress={onPress} testID={testId}>
        <>
          <View style={styles.itemTextContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <ForwardChevron color={Colors.successDark} />
        </>
      </Touchable>
    </Card>
  )
}

const styles = StyleSheet.create({
  itemTextContainer: {
    flex: 1,
    marginRight: Spacing.Regular16,
  },
  pressableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: Spacing.Regular16,
  },
  card: {
    marginTop: Spacing.Regular16,
    alignItems: 'center',
    padding: 0,
  },
  title: {
    ...typeScale.labelSmall,
    lineHeight: 24,
    paddingBottom: 5,
    color: Colors.successDark,
  },
  subtitle: {
    ...typeScale.bodyXSmall,
    color: Colors.gray5,
  },
})

export default OnboardingCard
