/**
 * This is a VIEW. We use it everwhere we need to show PIN pad
 * with an input, e.g. get/ensure/set pincode.
 */
import React, { useEffect } from 'react'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import NumberKeypad from 'src/components/NumberKeypad'
import { PIN_LENGTH } from 'src/pincode/authentication'
import PincodeDisplay from 'src/pincode/PincodeDisplay'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  title?: string
  changePin?: boolean
  errorText?: string
  maxLength?: number
  pin: string
  onChangePin: (pin: string) => void
  onCompletePin: (pin: string) => void
}

function Pincode({
  title,
  errorText,
  maxLength = PIN_LENGTH,
  pin,
  onChangePin,
  onCompletePin,
}: Props) {
  const onDigitPress = (digit: number) => {
    if (pin.length >= maxLength) {
      return
    }

    const newPin = pin + digit
    onChangePin(newPin)
    if (newPin.length === maxLength) {
      // Wait for next frame so we the user can see the last digit
      // displayed before acting on it
      requestAnimationFrame(() => onCompletePin(newPin))
    }
  }

  const onBackspacePress = () => {
    onChangePin(pin.substr(0, pin.length - 1))
  }

  useEffect(() => {
    Keyboard.dismiss()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.spacer} />
      {!errorText && <Text style={styles.title}>{title || ' '}</Text>}
      {!!errorText && <Text style={styles.error}>{errorText}</Text>}
      <View style={styles.pincodeContainer}>
        <PincodeDisplay pin={pin} maxLength={maxLength} />
      </View>
      <View style={styles.spacer} />
      <NumberKeypad onDigitPress={onDigitPress} onBackspacePress={onBackspacePress} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  title: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginBottom: 24,
  },
  error: {
    ...fontStyles.regular500,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 24,
  },
  pincodeContainer: {
    marginBottom: 24,
    paddingHorizontal: '15%',
    alignItems: 'center',
  },
})

export default Pincode
