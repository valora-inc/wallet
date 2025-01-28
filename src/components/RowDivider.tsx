import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Colors, { ColorValue } from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

export interface Props {
  color?: ColorValue
}

export default function RowDivider({ color = Colors.borderPrimary }: Props) {
  return <View style={[styles.container, { backgroundColor: color }]} />
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.Regular16,
  },
})
