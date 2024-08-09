import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  style?: StyleProp<ViewStyle>
  text: string
  children?: React.ReactNode
}

/**
 * A component to render an empty state with a message and optional children.
 */
export default function EmptyView(props: Props) {
  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.text}>{props.text}</Text>
      {props.children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.Thick24,
    paddingTop: 75,
  },
  text: {
    ...typeScale.bodyMedium,
    marginBottom: Spacing.Regular16,
  },
})
