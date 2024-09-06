import * as React from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { Spacing } from 'src/styles/styles'

type Props = Omit<LinearGradient['props'], 'colors'> & {
  colors?: LinearGradient['props']['colors']
}

export default function GradientDivider({ style, ...props }: Props) {
  return (
    <LinearGradient
      colors={['#26D98A', '#FFD52C']}
      locations={[0, 0.8915]}
      useAngle={true}
      angle={90}
      style={[styles.gradient, style]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  gradient: {
    marginVertical: Spacing.Smallest8,
    marginHorizontal: Spacing.Regular16,
    height: 1,
  },
})
