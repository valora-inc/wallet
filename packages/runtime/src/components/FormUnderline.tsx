import React from 'react'
import { StyleSheet, View } from 'react-native'
import colors from 'src/styles/colors'

export default function FormUnderline() {
  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    backgroundColor: colors.onboardingBrownLight,
    opacity: 0.2,
  },
})
