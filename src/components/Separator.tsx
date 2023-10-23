import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import colors, { Colors } from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

export interface Props {
  color?: Colors
}

export default function Separator({ color = Colors.gray2 }: Props) {
  return <View style={styles.separator} />
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: colors.gray2,
    marginVertical: Spacing.Regular16,
  },
})
