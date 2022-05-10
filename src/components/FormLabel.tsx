import React from 'react'
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export default function FormLabel({ style, children }: Props) {
  return <Text style={[styles.container, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  container: {
    ...fontStyles.label,
    color: colors.onboardingBrownLight,
  },
})
