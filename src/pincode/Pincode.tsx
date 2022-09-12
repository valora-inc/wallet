/**
 * This is a VIEW. We use it everwhere we need to show PIN pad
 * with an input, e.g. get/ensure/set pincode.
 */
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native'
import { showGuidedOnboardingSelector } from 'src/app/selectors'
import NumberKeypad from 'src/components/NumberKeypad'
import { PIN_LENGTH } from 'src/pincode/authentication'
import PincodeDisplay from 'src/pincode/PincodeDisplay'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  title?: string
  changePin?: boolean
  onBoardingSetPin?: boolean
  verifyPin?: boolean
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
  onBoardingSetPin,
  verifyPin, // true during onboarding pin re-entry
  onChangePin,
  onCompletePin,
}: Props) {
  const { t } = useTranslation()

  const onDigitPress = (digit: number) => {
    if (pin.length >= maxLength) {
      return
    }

    const newPin = pin + digit
    onChangePin(newPin)
  }

  const onBackspacePress = () => {
    onChangePin(pin.substring(0, pin.length - 1))
  }

  const showGuidedOnboarding = useSelector(showGuidedOnboardingSelector)

  useEffect(() => {
    // Wait for next frame so we the user can see the last digit
    // displayed before acting on it
    if (pin.length === maxLength) {
      requestAnimationFrame(() => onCompletePin(pin))
    }
  }, [pin])

  useEffect(() => {
    Keyboard.dismiss()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.spacer} />
      {!errorText && <Text style={styles.title}>{title || ' '}</Text>}
      {!!errorText && <Text style={styles.error}>{errorText}</Text>}
      {showGuidedOnboarding && onBoardingSetPin && (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.guidedOnboardingHeader}>
            {verifyPin ? t('pincodeSet.guideConfirm') : t('pincodeSet.guideTitle')}
          </Text>
          <Text style={styles.guidedOnboardingCopy}>{t('pincodeSet.pinCodeGuide')}</Text>
        </ScrollView>
      )}
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
  guidedOnboardingCopy: {
    ...fontStyles.regular,
    textAlign: 'center',
  },
  guidedOnboardingHeader: {
    ...fontStyles.h1,
    textAlign: 'center',
    marginBottom: 24,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    marginLeft: 24,
    marginRight: 24,
  },
})

export default Pincode
