import { Countries } from '@celo/phone-utils'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { getPhoneNumberDetails } from 'src/account/utils'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import PhoneNumberInput from 'src/components/PhoneNumberInput'
import i18n from 'src/i18n'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.KeylessBackupPhoneInput>

function KeylessBackupPhoneInput({ route }: Props) {
  const { t } = useTranslation()
  const { selectedCountryCodeAlpha2, keylessBackupFlow } = route.params
  const cachedNumber = useSelector(e164NumberSelector)
  const cachedCountryCallingCode = useSelector(defaultCountryCodeSelector)
  const countries = useMemo(() => new Countries(i18n.language), [i18n.language])
  const [phoneNumberInfo, setPhoneNumberInfo] = useState(() =>
    getPhoneNumberDetails(
      cachedNumber || '',
      cachedCountryCallingCode || '',
      selectedCountryCodeAlpha2 || RNLocalize.getCountry()
    )
  )
  const country = phoneNumberInfo.countryCodeAlpha2
    ? countries.getCountryByCodeAlpha2(phoneNumberInfo.countryCodeAlpha2)
    : undefined

  useEffect(() => {
    const newCountryAlpha2 = route.params?.selectedCountryCodeAlpha2
    if (newCountryAlpha2 && newCountryAlpha2 !== phoneNumberInfo.countryCodeAlpha2) {
      const countryCallingCode =
        countries.getCountryByCodeAlpha2(newCountryAlpha2)?.countryCallingCode ?? ''
      setPhoneNumberInfo(
        getPhoneNumberDetails(
          phoneNumberInfo.internationalPhoneNumber,
          countryCallingCode,
          newCountryAlpha2
        )
      )
    }
  }, [route.params?.selectedCountryCodeAlpha2])

  const onChangePhoneNumberInput = (
    internationalPhoneNumber: string,
    countryCallingCode: string
  ) => {
    setPhoneNumberInfo(
      getPhoneNumberDetails(
        internationalPhoneNumber,
        countryCallingCode,
        phoneNumberInfo.countryCodeAlpha2
      )
    )
  }
  const onPressCountry = () => {
    navigate(Screens.SelectCountry, {
      countries,
      selectedCountryCodeAlpha2: phoneNumberInfo.countryCodeAlpha2,
      onSelectCountry: (countryCodeAlpha2: string) => {
        navigate(Screens.KeylessBackupPhoneInput, {
          keylessBackupFlow,
          selectedCountryCodeAlpha2: countryCodeAlpha2,
        })
      },
    })
  }

  const onPressContinue = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_enter_phone_number_continue, {
      keylessBackupFlow,
    })
    navigate(Screens.KeylessBackupPhoneCodeInput, {
      keylessBackupFlow,
      e164Number: phoneNumberInfo.e164Number,
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>
          {keylessBackupFlow === KeylessBackupFlow.Setup
            ? t('keylessBackupPhoneInput.setup.title')
            : t('keylessBackupPhoneInput.restore.title')}
        </Text>
        <Text style={styles.subtitle}>
          {keylessBackupFlow === KeylessBackupFlow.Setup
            ? t('keylessBackupPhoneInput.setup.subtitle')
            : t('keylessBackupPhoneInput.restore.subtitle')}
        </Text>
        <PhoneNumberInput
          countryFlagStyle={styles.countryFlagStyle}
          label={''}
          country={country}
          internationalPhoneNumber={phoneNumberInfo.internationalPhoneNumber}
          onPressCountry={onPressCountry}
          onChange={onChangePhoneNumberInput}
        />
      </ScrollView>
      <Button
        testID="KeylessBackupPhoneInput/Continue"
        onPress={onPressContinue}
        text={keylessBackupFlow === KeylessBackupFlow.Setup ? t('continue') : t('next')}
        size={BtnSizes.FULL}
        type={BtnTypes.PRIMARY}
        style={styles.button}
        disabled={!phoneNumberInfo.isValidNumber}
      />
    </SafeAreaView>
  )
}

KeylessBackupPhoneInput.navigationOptions = ({ route }: Props) => ({
  ...emptyHeader,
  headerLeft: () => (
    <KeylessBackupCancelButton
      flow={route.params.keylessBackupFlow}
      eventName={KeylessBackupEvents.cab_enter_phone_number_cancel}
    />
  ),
})

export default KeylessBackupPhoneInput

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  scrollContainer: {
    padding: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
    color: Colors.black,
  },
  subtitle: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    paddingVertical: Spacing.Regular16,
    color: Colors.black,
  },
  button: {
    padding: Spacing.Thick24,
  },
  countryFlagStyle: {
    backgroundColor: Colors.gray2,
    marginRight: Spacing.Smallest8,
  },
})
