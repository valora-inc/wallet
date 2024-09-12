import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

export function Card({
  children,
  testID,
  cardStyle,
}: {
  children: React.ReactNode
  testID: string
  cardStyle?: ViewStyle
}) {
  return (
    <View testID={testID} style={[styles.card, cardStyle]}>
      {children}
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
})
