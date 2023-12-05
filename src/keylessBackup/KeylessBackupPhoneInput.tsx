import { Countries } from '@celo/phone-utils'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { useSelector } from 'react-redux'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { getPhoneNumberDetails } from 'src/account/utils'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import PhoneNumberInput from 'src/components/PhoneNumberInput'
import i18n from 'src/i18n'
import Times from 'src/icons/Times'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

function KeylessBackupPhoneInput({
  route,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupPhoneInput>) {
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
    ValoraAnalytics.track(KeylessBackupEvents.enter_phone_number_continue, {
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
        type={BtnTypes.ONBOARDING}
        style={styles.button}
        disabled={!phoneNumberInfo.isValidNumber}
      />
    </SafeAreaView>
  )
}

KeylessBackupPhoneInput.navigationOptions = () => ({
  ...emptyHeader,
  headerLeft: () => (
    <TopBarIconButton
      icon={<Times />}
      onPress={navigateBack} // TODO: handle in ACT-770
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
    padding: 24,
    paddingTop: 36,
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
  countryFlagStyle: {
    backgroundColor: Colors.onboardingBackground,
    marginRight: 8,
  },
})
