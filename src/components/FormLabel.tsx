import React from 'react'
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

interface Props {
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export default function FormLabel({ style, children }: Props) {
  return <Text style={[styles.container, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  container: {
    ...typeScale.labelSemiBoldSmall,
    color: colors.onboardingBrownLight,
  },
})
