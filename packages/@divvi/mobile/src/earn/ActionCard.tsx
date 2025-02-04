import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import { BeforeDepositAction, WithdrawAction } from 'src/earn/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export function ActionCard({ action }: { action: BeforeDepositAction | WithdrawAction }) {
  return (
    <Touchable
      style={styles.touchable}
      key={action.name}
      borderRadius={20}
      onPress={action.onPress}
      testID={`Earn/ActionCard/${action.name}`}
    >
      <>
        <action.iconComponent color={Colors.contentPrimary} />
        <View style={styles.cardContainer}>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionDetails}>{action.details}</Text>
        </View>
      </>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  actionTitle: {
    ...typeScale.labelMedium,
  },
  actionDetails: {
    ...typeScale.bodySmall,
  },
  touchable: {
    backgroundColor: Colors.buttonSecondaryBackground,
    padding: Spacing.Regular16,
    flexDirection: 'row',
    gap: Spacing.Regular16,
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
  },
})
