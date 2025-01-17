import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Colors from 'src/styles/colors'

interface Props {
  radius?: number
  borderWidth?: number
  children?: React.ReactNode
}

export default function GradientIcon({ radius = 50, borderWidth = 1, children }: Props) {
  const gradientBackgroundStyles = [
    styles.background,
    {
      borderRadius: radius,
      height: radius - borderWidth * 2,
      width: radius - borderWidth * 2,
    },
  ]

  return (
    <View
      style={[
        styles.container,
        {
          height: radius,
          width: radius,
          borderRadius: radius,
        },
      ]}
    >
      {borderWidth > 0 && (
        <LinearGradient
          colors={[Colors.gradientBorderLeft, Colors.gradientBorderRight]}
          locations={[0, 0.8915]}
          useAngle={true}
          angle={90}
          style={[styles.background, { borderRadius: radius }]}
        />
      )}
      <LinearGradient
        colors={[Colors.gradientBorderLeft, Colors.gradientBorderRight]}
        locations={[0.1085, 1]}
        useAngle={true}
        angle={90}
        style={gradientBackgroundStyles}
      />
      {/* Apply a semi-transparent white overlay to tone down the brand gradient. react-native-linear-gradient doesn't support semi-transparent gradients with different colors. */}
      <View style={[gradientBackgroundStyles, styles.mask]} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  mask: {
    // White is intentionally hardcoded as it effectively softens the gradient
    // without altering its color balance, ensuring the design remains consistent.
    backgroundColor: 'white',
    opacity: 0.9,
  },
})
