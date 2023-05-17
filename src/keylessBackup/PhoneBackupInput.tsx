import { Countries } from '@celo/phone-utils'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { useSelector } from 'react-redux'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import PhoneNumberInput from 'src/components/PhoneNumberInput'
import i18n from 'src/i18n'
import Times from 'src/icons/Times'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'
import { getPhoneNumberState } from 'src/verify/VerificationStartScreen'

function onPressContinue() {
  ValoraAnalytics.track(KeylessBackupEvents.set_up_keyless_backup_screen_continue)
  navigate(Screens.SignInWithEmail)
}

function PhoneBackupInput({
  route,
}: NativeStackScreenProps<StackParamList, Screens.PhoneBackupInput>) {
  const { t } = useTranslation()
  const { selectedCountryCodeAlpha2, keylessBackupFlow } = route.params
  console.debug('PhoneBackupInput', selectedCountryCodeAlpha2, keylessBackupFlow)
  const [phoneNumberInfo, setPhoneNumberInfo] = useState(() =>
    getPhoneNumberState(
      cachedNumber || '',
      cachedCountryCallingCode || '',
      selectedCountryCodeAlpha2 || RNLocalize.getCountry()
    )
  )
  const cachedNumber = useSelector(e164NumberSelector)
  const cachedCountryCallingCode = useSelector(defaultCountryCodeSelector)
  const countries = useMemo(() => new Countries(i18n.language), [i18n.language])
  const country = phoneNumberInfo.countryCodeAlpha2
    ? countries.getCountryByCodeAlpha2(phoneNumberInfo.countryCodeAlpha2)
    : undefined

  useEffect(() => {
    const newCountryAlpha2 = route.params?.selectedCountryCodeAlpha2
    if (newCountryAlpha2 && newCountryAlpha2 !== phoneNumberInfo.countryCodeAlpha2) {
      const countryCallingCode =
        countries.getCountryByCodeAlpha2(newCountryAlpha2)?.countryCallingCode ?? ''
      setPhoneNumberInfo(
        getPhoneNumberState(
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
      getPhoneNumberState(
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
      hideOnboardingStep: true,
      keylessBackupFlow,
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{t('signInWithPhone.title')}</Text>
        <Text style={styles.subtitle}>{t('signInWithPhone.subtitle')}</Text>
        <PhoneNumberInput
          label={t('phoneNumber')}
          country={country}
          internationalPhoneNumber={phoneNumberInfo.internationalPhoneNumber}
          onPressCountry={onPressCountry}
          onChange={onChangePhoneNumberInput}
        />
      </ScrollView>
      <Button
        testID="SetUpKeylessBackup/Continue"
        onPress={onPressContinue}
        text={t('continue')}
        size={BtnSizes.FULL}
        type={BtnTypes.ONBOARDING}
        style={styles.button}
      />
    </SafeAreaView>
  )
}

PhoneBackupInput.navigationOptions = () => ({
  ...emptyHeader,
  headerLeft: () => (
    <TopBarIconButton
      style={styles.cancelButton}
      icon={<Times height={16} />}
      onPress={navigateBack}
    />
  ),
})

export default PhoneBackupInput

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 36,
  },
  cancelButton: {
    marginLeft: 16,
  },
  title: {
    ...fontStyles.h2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingVertical: 8,
  },
  button: {
    padding: 24,
  },
})
