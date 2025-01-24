import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

export interface Props {
  color?: Colors
}

export default function RowDivider({ color = Colors.gray2 }: Props) {
  return <View style={[styles.container, { backgroundColor: color }]} />
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.Regular16,
  },
})
