import React from 'react'
import { StyleSheet } from 'react-native'
import { TopBarTextButton, TopBarTextButtonProps } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'

export default function TopBarTextButtonOnboarding({
  titleStyle,
  ...passThroughProps
}: TopBarTextButtonProps) {
  return <TopBarTextButton titleStyle={[styles.title, titleStyle]} {...passThroughProps} />
}

const styles = StyleSheet.create({
  title: {
    color: colors.onboardingBrownLight,
  },
})
