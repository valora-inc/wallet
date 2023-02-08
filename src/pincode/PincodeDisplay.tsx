import React, { useEffect, useRef } from 'react'
import { LayoutAnimation, StyleSheet, View } from 'react-native'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

// How long the last entered digit is visible
const LAST_DIGIT_VISIBLE_INTERVAL = 2000 // 0.5secs

const DOT_SIZE = 8

interface Props {
  pin: string
  maxLength: number
}

export default function PincodeDisplay({ pin, maxLength }: Props) {
  const prevPinRef = useRef(pin)

  useEffect(() => {
    const prevPin = prevPinRef.current
    prevPinRef.current = pin

    // Check if pin length is smaller, so as not to reveal previous digits
    // when deleting
    if (pin.length < prevPin.length) {
      LayoutAnimation.configureNext({
        ...LayoutAnimation.Presets.easeInEaseOut,
        duration: 150,
      })
      return
    }
  }, [pin])

  return (
    <View style={styles.container} testID="PincodeDisplay">
      {Array.from({ length: maxLength }).map((x, index) => {
        const isEntered = index < pin.length
        const key = `${index}_${isEntered}`

        return (
          <View key={key} style={styles.inputContainer}>
            {<View style={[styles.dot, isEntered && styles.dotFilled]} />}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  inputContainer: {
    flex: 1,
    height: fontStyles.h1.lineHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  char: {
    ...fontStyles.h1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.dark,
  },
  dotFilled: {
    backgroundColor: colors.dark,
  },
})
