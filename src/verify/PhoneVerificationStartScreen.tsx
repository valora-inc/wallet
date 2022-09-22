import { Countries } from '@celo/utils/lib/countries'
import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { initializeAccount, setPhoneNumber } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { OnboardingEvents, VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { registrationStepsSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import Button, { BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import PhoneNumberInput from 'src/components/PhoneNumberInput'
import TextButton from 'src/components/TextButton'
import i18n from 'src/i18n'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { waitUntilSagasFinishLoading } from 'src/redux/sagas'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { getCountryFeatures } from 'src/utils/countryFeatures'
import { getPhoneNumberState } from 'src/verify/utils'
import { walletAddressSelector } from 'src/web3/selectors'

function PhoneVerificationStartScreen({
  route,
  navigation,
}: StackScreenProps<StackParamList, Screens.VerificationEducationScreen>) {
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false)
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [phoneNumberInfo, setPhoneNumberInfo] = useState(() =>
    getPhoneNumberState(
      cachedNumber || '',
      cachedCountryCallingCode || '',
      route.params?.selectedCountryCodeAlpha2 || RNLocalize.getCountry()
    )
  )

  const { t } = useTranslation()
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()

  const account = useSelector(walletAddressSelector)
  const cachedNumber = useSelector(e164NumberSelector)
  const cachedCountryCallingCode = useSelector(defaultCountryCodeSelector)
  const walletAddress = useSelector(walletAddressSelector)
  const { step, totalSteps } = useSelector(registrationStepsSelector)

  const countries = useMemo(() => new Countries(i18n.language), [i18n.language])
  const country = phoneNumberInfo.countryCodeAlpha2
    ? countries.getCountryByCodeAlpha2(phoneNumberInfo.countryCodeAlpha2)
    : undefined

  const onPressStart = async () => {
    if (!canUsePhoneNumber()) {
      return
    }
    // TODO figure out what this nux thing does
    dispatch(setHasSeenVerificationNux(true))
    // TODO dispatch action to call start verification service
    navigate(Screens.PhoneVerificationInputScreen, {
      registrationStep: route.params?.hideOnboardingStep ? undefined : { step, totalSteps },
      e164Number: phoneNumberInfo.e164Number,
    })
  }

  const onPressSkip = () => {
    ValoraAnalytics.track(VerificationEvents.verification_skip)
    setShowSkipDialog(true)
  }

  const onPressSkipCancel = () => {
    setShowSkipDialog(false)
  }

  const onPressSkipConfirm = () => {
    dispatch(setHasSeenVerificationNux(true))
    ValoraAnalytics.track(VerificationEvents.verification_skip_confirm)
    navigateHome()
  }

  const onPressLearnMore = () => {
    setShowLearnMoreDialog(true)
  }

  const onPressLearnMoreDismiss = () => {
    setShowLearnMoreDialog(false)
  }

  useLayoutEffect(() => {
    const title = route.params?.hideOnboardingStep
      ? t('verificationEducation.title')
      : () => (
          <HeaderTitleWithSubtitle
            title={t('verificationEducation.title')}
            subTitle={t('registrationSteps', { step, totalSteps })}
          />
        )

    navigation.setOptions({
      headerTitle: title,
      headerRight: () =>
        !route.params?.hideOnboardingStep && (
          <TopBarTextButton
            title={t('skip')}
            testID="VerificationEducationSkipHeader"
            onPress={onPressSkip}
            titleStyle={{ color: colors.goldDark }}
          />
        ),
      headerLeft: () => route.params?.hideOnboardingStep && <BackButton />,
    })
  }, [navigation, step, totalSteps, route.params])

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

  useAsync(async () => {
    await waitUntilSagasFinishLoading()
    if (walletAddress === null) {
      dispatch(initializeAccount())
    }
  }, [])

  const canUsePhoneNumber = () => {
    const countryCallingCode = country?.countryCallingCode || ''
    if (
      cachedNumber === phoneNumberInfo.e164Number &&
      cachedCountryCallingCode === countryCallingCode
    ) {
      return true
    }

    const { SANCTIONED_COUNTRY } = getCountryFeatures(phoneNumberInfo.countryCodeAlpha2)
    if (SANCTIONED_COUNTRY) {
      dispatch(showError(ErrorMessages.COUNTRY_NOT_AVAILABLE))
      return false
    }

    ValoraAnalytics.track(OnboardingEvents.phone_number_set, {
      country: country?.displayNameNoDiacritics || '',
      countryCode: countryCallingCode,
    })
    dispatch(setPhoneNumber(phoneNumberInfo.e164Number, countryCallingCode))
    return true
  }

  const onPressCountry = () => {
    navigate(Screens.SelectCountry, {
      countries,
      selectedCountryCodeAlpha2: phoneNumberInfo.countryCodeAlpha2,
    })
  }

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

  if (!account) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          headerHeight ? { marginTop: headerHeight } : undefined,
        ]}
      >
        <Text style={styles.header} testID="PhoneVerificationHeader">
          {t('verificationEducation.header')}
        </Text>
        <Text style={styles.body}>{t('phoneVerification.description')}</Text>
        <PhoneNumberInput
          label={t('phoneNumber')}
          style={styles.phoneNumber}
          country={country}
          internationalPhoneNumber={phoneNumberInfo.internationalPhoneNumber}
          onPressCountry={onPressCountry}
          onChange={onChangePhoneNumberInput}
        />
        <Button
          text={t('verificationEducation.start')}
          onPress={onPressStart}
          type={BtnTypes.ONBOARDING}
          style={styles.startButton}
          disabled={!phoneNumberInfo.isValidNumber}
          testID="PhoneVerificationContinue"
        />
        <View style={styles.bottomButtonContainer}>
          <TextButton
            testID="PhoneVerificationLearnMore"
            style={styles.doINeedToConfirmButton}
            onPress={onPressLearnMore}
          >
            {t('verificationEducation.doINeedToConfirm')}
          </TextButton>
        </View>
      </ScrollView>
      <Dialog
        title={t('phoneVerification.title')}
        isVisible={showSkipDialog}
        actionText={t('phoneVerification.confirm')}
        actionPress={onPressSkipConfirm}
        secondaryActionPress={onPressSkipCancel}
        secondaryActionText={t('phoneVerification.cancel')}
        testID="phoneVerificationSkipDialog"
      >
        {t('phoneVerification.body')}
      </Dialog>
      <Dialog
        testID="PhoneVerificationLearnMoreDialog"
        title={t('phoneVerification.learnMore.title')}
        isVisible={showLearnMoreDialog}
        actionText={t('dismiss')}
        actionPress={onPressLearnMoreDismiss}
        isActionHighlighted={false}
        onBackgroundPress={onPressLearnMoreDismiss}
      >
        {t('phoneVerification.learnMore.body')}
      </Dialog>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Spacing.Thick24,
    width: '100%',
  },
  header: {
    ...fontStyles.h2,
    marginBottom: Spacing.Regular16,
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
  startButton: {
    marginBottom: Spacing.Thick24,
  },
  phoneNumber: {
    marginBottom: Spacing.Thick24,
  },
  bottomButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  doINeedToConfirmButton: {
    color: colors.onboardingBrownLight,
  },
})

export default PhoneVerificationStartScreen
