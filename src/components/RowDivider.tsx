import * as React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { Colors } from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

export interface Props {
  color?: Colors
  style?: ViewStyle
}

export default function RowDivider({ color = Colors.gray2, style }: Props) {
  return <View style={[styles.container, { backgroundColor: color }, style]} />
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.Regular16,
  },
})
