import { Countries, parsePhoneNumber } from '@celo/phone-utils'
import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { initializeAccount } from 'src/account/actions'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { PhoneVerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { registrationStepsSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InfoBottomSheet from 'src/components/InfoBottomSheet'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import PhoneNumberInput from 'src/components/PhoneNumberInput'
import TextButton from 'src/components/TextButton'
import i18n from 'src/i18n'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { waitUntilSagasFinishLoading } from 'src/redux/sagas'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { walletAddressSelector } from 'src/web3/selectors'

function getPhoneNumberState(
  phoneNumber: string,
  countryCallingCode: string,
  countryCodeAlpha2: string
) {
  const phoneDetails = parsePhoneNumber(phoneNumber, countryCallingCode)

  if (phoneDetails) {
    return {
      // Show international display number to avoid confusion
      internationalPhoneNumber: phoneDetails.displayNumberInternational,
      e164Number: phoneDetails.e164Number,
      isValidNumber: true,
      countryCodeAlpha2: phoneDetails.regionCode!,
    }
  } else {
    return {
      internationalPhoneNumber: phoneNumber,
      e164Number: '',
      isValidNumber: false,
      countryCodeAlpha2,
    }
  }
}

function VerificationStartScreen({
  route,
  navigation,
}: NativeStackScreenProps<StackParamList, Screens.VerificationStartScreen>) {
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false)
  const [phoneNumberInfo, setPhoneNumberInfo] = useState(() =>
    getPhoneNumberState(
      cachedNumber || '',
      cachedCountryCallingCode || '',
      route.params?.selectedCountryCodeAlpha2 || RNLocalize.getCountry()
    )
  )
  const [signedMessageCreated, setSignedMessageCreated] = useState(false)

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

  const onPressStart = () => {
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_start, {
      country: country?.displayNameNoDiacritics || '',
      countryCallingCode: country?.countryCallingCode || '',
    })

    dispatch(setHasSeenVerificationNux(true))
    navigate(Screens.VerificationCodeInputScreen, {
      registrationStep: route.params?.hideOnboardingStep ? undefined : { step, totalSteps },
      e164Number: phoneNumberInfo.e164Number,
      countryCallingCode: country?.countryCallingCode || '',
    })
  }

  const onPressSkip = () => {
    dispatch(setHasSeenVerificationNux(true))
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_skip_confirm)
    navigateHome()
  }

  const onPressLearnMore = () => {
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_learn_more)
    setShowLearnMoreDialog(true)
  }

  const onPressLearnMoreDismiss = () => {
    setShowLearnMoreDialog(false)
  }

  useLayoutEffect(() => {
    const title = route.params?.hideOnboardingStep
      ? t('phoneVerificationScreen.screenTitle')
      : () => (
          <HeaderTitleWithSubtitle
            title={t('phoneVerificationScreen.screenTitle')}
            subTitle={t('registrationSteps', { step, totalSteps })}
          />
        )

    navigation.setOptions({
      headerTitle: title,
      headerRight: () =>
        !route.params?.hideOnboardingStep && (
          <TopBarTextButton
            title={t('skip')}
            testID="PhoneVerificationSkipHeader"
            onPress={onPressSkip}
            titleStyle={{ color: colors.onboardingBrownLight }}
          />
        ),
      headerLeft: () => route.params?.hideOnboardingStep && <BackButton />,
      // Disable iOS back during onboarding
      gestureEnabled: route.params?.hideOnboardingStep ? false : true,
    })
  }, [navigation, step, totalSteps, route.params])

  // Prevent device back on Android during onboarding
  useEffect(() => {
    if (!route.params?.hideOnboardingStep) {
      const backPressListener = () => true
      BackHandler.addEventListener('hardwareBackPress', backPressListener)
      return () => BackHandler.removeEventListener('hardwareBackPress', backPressListener)
    }
  }, [])

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

  useEffect(() => {
    if (signedMessageCreated) {
      return
    }

    const interval = setInterval(async () => {
      const signedMessage = await retrieveSignedMessage()
      setSignedMessageCreated(!!signedMessage)
    }, 500)

    return () => clearInterval(interval)
  }, [signedMessageCreated])

  useAsync(async () => {
    await waitUntilSagasFinishLoading()
    if (walletAddress === null) {
      dispatch(initializeAccount())
    }
  }, [])

  const onPressCountry = () => {
    navigate(Screens.SelectCountry, {
      countries,
      selectedCountryCodeAlpha2: phoneNumberInfo.countryCodeAlpha2,
      hideOnboardingStep: !!route.params?.hideOnboardingStep,
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
      <KeyboardAwareScrollView
        style={[styles.scrollContainer, headerHeight ? { marginTop: headerHeight } : undefined]}
        keyboardShouldPersistTaps="always"
      >
        <Text style={styles.header} testID="PhoneVerificationHeader">
          {t('phoneVerificationScreen.title')}
        </Text>
        <Text style={styles.body}>{t('phoneVerificationScreen.description')}</Text>
        <PhoneNumberInput
          label={t('phoneNumber')}
          style={styles.phoneNumber}
          country={country}
          internationalPhoneNumber={phoneNumberInfo.internationalPhoneNumber}
          onPressCountry={onPressCountry}
          onChange={onChangePhoneNumberInput}
        />
        <Button
          text={t('phoneVerificationScreen.startButtonLabel')}
          onPress={onPressStart}
          type={BtnTypes.ONBOARDING}
          size={BtnSizes.FULL}
          showLoading={!signedMessageCreated}
          style={styles.startButton}
          disabled={!phoneNumberInfo.isValidNumber || !signedMessageCreated}
          testID="PhoneVerificationContinue"
        />
      </KeyboardAwareScrollView>
      <View style={styles.bottomButtonContainer}>
        <TextButton
          testID="PhoneVerificationLearnMore"
          style={styles.learnMore}
          onPress={onPressLearnMore}
        >
          {t('phoneVerificationScreen.learnMore.buttonLabel')}
        </TextButton>
      </View>
      <KeyboardSpacer />
      <InfoBottomSheet
        isVisible={showLearnMoreDialog}
        title={t('phoneVerificationScreen.learnMore.title')}
        body={t('phoneVerificationScreen.learnMore.body')}
        onDismiss={onPressLearnMoreDismiss}
        testID="PhoneVerificationLearnMoreDialog"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: Spacing.Thick24,
    width: '100%',
  },
  header: {
    ...fontStyles.h1,
    marginBottom: Spacing.Regular16,
    textAlign: 'center',
  },
  body: {
    ...fontStyles.regular,
    marginBottom: 32,
    textAlign: 'center',
  },
  startButton: {
    marginBottom: Spacing.Thick24,
  },
  phoneNumber: {
    marginBottom: 32,
  },
  bottomButtonContainer: {
    padding: Spacing.Thick24,
    alignItems: 'center',
  },
  learnMore: {
    color: colors.onboardingBrownLight,
  },
})

export default VerificationStartScreen
