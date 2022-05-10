import SmsRetriever from '@celo/react-native-sms-retriever'
import { LocalizedCountry } from '@celo/utils/lib/countries'
import { ValidatorKind } from '@celo/utils/lib/inputValidation'
import { parsePhoneNumber } from '@celo/utils/lib/phoneNumbers'
import React, { useEffect, useRef } from 'react'
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Expandable from 'src/components/Expandable'
import FormField from 'src/components/FormField'
import FormTextInput from 'src/components/FormTextInput'
import Touchable from 'src/components/Touchable'
import ValidatedTextInput from 'src/components/ValidatedTextInput'
import colors from 'src/styles/colors'

const TAG = 'PhoneNumberInput'

async function requestPhoneNumber() {
  let phoneNumber
  try {
    if (Platform.OS === 'android') {
      phoneNumber = await SmsRetriever.requestPhoneNumber()
    } else {
      // eslint-disable-next-line no-console
      console.info(`${TAG}/requestPhoneNumber`, 'Not implemented in this platform')
    }
    return parsePhoneNumber(phoneNumber, '')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.info(`${TAG}/requestPhoneNumber`, 'Could not request phone', error)
  }
}

interface Props {
  label: string
  style?: StyleProp<ViewStyle>
  country: LocalizedCountry | undefined
  internationalPhoneNumber: string
  onPressCountry?: () => void
  onChange?: (internationalPhoneNumber: string, countryCallingCode: string) => void
  editable?: boolean
}

export default function PhoneNumberInput({
  label,
  style,
  country,
  internationalPhoneNumber,
  onPressCountry,
  onChange,
  editable = true,
}: Props) {
  const shouldRequestPhoneNumberRef = useRef(internationalPhoneNumber.length === 0)
  const phoneInputRef = useRef<any>()
  const flagEmoji = country?.emoji
  const countryCallingCode = country?.countryCallingCode ?? ''
  const numberPlaceholder = country?.countryPhonePlaceholder.national ?? ''

  async function onPressCountryInternal() {
    const handled = await requestPhoneNumberIfNecessary()
    if (handled || !onPressCountry) {
      return
    }

    onPressCountry()
  }

  // Returns true if handled
  async function requestPhoneNumberIfNecessary() {
    if (!shouldRequestPhoneNumberRef.current) {
      return false
    }
    shouldRequestPhoneNumberRef.current = false

    const parsedPhoneNumber = await requestPhoneNumber()
    if (!parsedPhoneNumber || !onChange) {
      return false
    }

    onChange(parsedPhoneNumber.displayNumber, `+${parsedPhoneNumber.countryCode}`)
    return true
  }

  function onChangePhoneNumber(newInternationalPhoneNumber: string) {
    if (onChange) {
      onChange(newInternationalPhoneNumber, countryCallingCode)
    }
  }

  useEffect(() => {
    if (country && phoneInputRef.current) {
      phoneInputRef.current.focus()
    }
  }, [country, phoneInputRef])

  return (
    <FormField style={[styles.container, style]} label={label}>
      <View style={styles.phoneNumberContainer}>
        <Touchable
          onPress={onPressCountryInternal}
          style={styles.countryCodeContainer}
          testID="CountrySelectionButton"
          disabled={!editable}
        >
          <View style={styles.countryCodeContent}>
            <Expandable
              isExpandable={editable}
              isExpanded={false}
              containerStyle={styles.countryFlagContainer}
            >
              <Text style={styles.flag} testID={'countryCodeFlag'}>
                {flagEmoji}
              </Text>
            </Expandable>
          </View>
        </Touchable>
        <ValidatedTextInput
          forwardedRef={phoneInputRef}
          InputComponent={FormTextInput}
          style={styles.phoneNumberInput}
          value={internationalPhoneNumber}
          placeholder={numberPlaceholder}
          keyboardType="phone-pad"
          testID="PhoneNumberField"
          validator={ValidatorKind.Phone}
          countryCallingCode={countryCallingCode}
          onFocus={requestPhoneNumberIfNecessary}
          onChangeText={onChangePhoneNumber}
          editable={editable}
          showClearButton={false}
        />
      </View>
    </FormField>
  )
}

const styles = StyleSheet.create({
  container: {},
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  countryCodeContainer: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'stretch',
    backgroundColor: colors.light,
    borderRadius: 8,
  },
  countryFlagContainer: {
    justifyContent: 'center',
  },
  countryCodeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  flag: {
    fontSize: 20,
  },
  phoneNumberInput: {
    flex: 1,
    marginLeft: 7,
  },
})
