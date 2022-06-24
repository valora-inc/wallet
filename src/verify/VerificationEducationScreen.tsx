import { Countries } from '@celo/utils/lib/countries'
import { useFocusEffect } from '@react-navigation/native'
import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import Modal from 'react-native-modal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { initializeAccount, setPhoneNumber } from 'src/account/actions'
import { choseToRestoreAccountSelector, defaultCountryCodeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { OnboardingEvents, VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  hideVerificationSelector,
  numberVerifiedSelector,
  registrationStepsSelector,
} from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import Button, { BtnTypes } from 'src/components/Button'
import PhoneNumberInput from 'src/components/PhoneNumberInput'
import TextButton from 'src/components/TextButton'
import { isE2EEnv, WEB_LINK } from 'src/config'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { startVerification } from 'src/identity/actions'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateInterests } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { waitUntilSagasFinishLoading } from 'src/redux/sagas'
import useTypedSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { getCountryFeatures } from 'src/utils/countryFeatures'
import Logger from 'src/utils/Logger'
import { useAsyncKomenciReadiness } from 'src/verify/hooks'
import {
  actionableAttestationsSelector,
  checkIfKomenciAvailable,
  currentStateSelector,
  isBalanceSufficientSelector,
  reset,
  setKomenciContext,
  shouldUseKomenciSelector,
  startKomenciSession,
  StateType,
  stop,
  verificationStatusSelector,
} from 'src/verify/reducer'
import GoogleReCaptcha from 'src/verify/safety/GoogleReCaptcha'
import { getPhoneNumberState } from 'src/verify/utils'
import VerificationLearnMoreDialog from 'src/verify/VerificationLearnMoreDialog'
import VerificationSkipDialog from 'src/verify/VerificationSkipDialog'
import { currentAccountSelector } from 'src/web3/selectors'

type ScreenProps = StackScreenProps<StackParamList, Screens.VerificationEducationScreen>

type Props = ScreenProps

function VerificationEducationScreen({ route, navigation }: Props) {
  const showSkipDialog = route.params?.showSkipDialog || false
  const account = useTypedSelector(currentAccountSelector)
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false)
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const numberVerified = useSelector(numberVerifiedSelector)
  const partOfOnboarding = !route.params?.hideOnboardingStep

  const cachedNumber = useTypedSelector((state) => state.account.e164PhoneNumber)
  const cachedCountryCallingCode = useTypedSelector(defaultCountryCodeSelector)
  const [phoneNumberInfo, setPhoneNumberInfo] = useState(() =>
    getPhoneNumberState(
      cachedNumber || '',
      cachedCountryCallingCode || '',
      route.params?.selectedCountryCodeAlpha2 || RNLocalize.getCountry()
    )
  )
  const countries = useMemo(() => new Countries(i18n.language), [i18n.language])
  const country = phoneNumberInfo.countryCodeAlpha2
    ? countries.getCountryByCodeAlpha2(phoneNumberInfo.countryCodeAlpha2)
    : undefined
  const currentState = useSelector(currentStateSelector)
  const shouldUseKomenci = useSelector(shouldUseKomenciSelector)
  const verificationStatus = useSelector(verificationStatusSelector)
  const choseToRestoreAccount = useSelector(choseToRestoreAccountSelector)
  const { step, totalSteps } = useSelector(registrationStepsSelector)

  const onPressStart = async () => {
    if (!canUsePhoneNumber()) {
      return
    }
    dispatch(startVerification(phoneNumberInfo.e164Number, noActionIsRequired))
  }

  const onPressSkipCancel = () => {
    navigation.setParams({ showSkipDialog: false })
  }

  const onPressSkipConfirm = () => {
    navigateInterests()
  }

  const onPressContinue = () => {
    if (partOfOnboarding) {
      navigate(Screens.OnboardingSuccessScreen)
    } else {
      navigateInterests()
    }
  }

  const onPressContinueWhenVerificationUnavailable = () => {
    if (!canUsePhoneNumber()) {
      return
    }

    navigateInterests()
  }

  const onPressLearnMore = () => {
    setShowLearnMoreDialog(true)
  }

  const onPressLearnMoreDismiss = () => {
    setShowLearnMoreDialog(false)
  }

  const cancelCaptcha = () => {
    dispatch(stop())
    ValoraAnalytics.track(VerificationEvents.verification_recaptcha_canceled)
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
            onPress={() => navigation.setParams({ showSkipDialog: true })}
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

  useEffect(() => {
    navigation.setParams({ choseToRestoreAccount })
  }, [choseToRestoreAccount])

  useAsync(async () => {
    await waitUntilSagasFinishLoading()
    dispatch(initializeAccount())
    dispatch(checkIfKomenciAvailable())
  }, [])

  // CB TEMPORARY HOTFIX: Pinging Komenci endpoint to ensure availability
  const hideVerification = useSelector(hideVerificationSelector)
  const asyncKomenciReadiness = useAsyncKomenciReadiness()

  useFocusEffect(
    // useCallback is needed here: https://bit.ly/2G0WKTJ
    useCallback(() => {
      if (shouldUseKomenci !== undefined && verificationStatus.komenci !== shouldUseKomenci) {
        dispatch(reset({ komenci: shouldUseKomenci }))
      }
    }, [shouldUseKomenci])
  )
  const actionableAttestations = useSelector(actionableAttestationsSelector)
  const { numAttestationsRemaining } = useSelector(verificationStatusSelector)

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

  const noActionIsRequired = numAttestationsRemaining <= actionableAttestations.length

  const handleCaptchaResolved = (res: any) => {
    const captchaToken = res?.nativeEvent?.data
    if (captchaToken !== 'cancel' && captchaToken !== 'error') {
      Logger.info('Captcha token received: ', captchaToken)
      dispatch(setKomenciContext({ captchaToken }))
      dispatch(startKomenciSession())
      ValoraAnalytics.track(VerificationEvents.verification_recaptcha_success)
    } else {
      dispatch(stop())
      ValoraAnalytics.track(VerificationEvents.verification_recaptcha_failure)
    }
  }

  useEffect(() => {
    if (isE2EEnv && currentState.type === StateType.EnsuringRealHumanUser) {
      handleCaptchaResolved({
        nativeEvent: {
          data: 'special-captcha-bypass-token',
        },
      })
    }
  }, [currentState.type])

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
    if (noActionIsRequired) {
      dispatch(reset({ komenci: shouldUseKomenci ?? true }))
    }
  }

  const isBalanceSufficient = useSelector(isBalanceSufficientSelector)

  if (asyncKomenciReadiness.loading || shouldUseKomenci === undefined || !account) {
    return (
      <View style={styles.loader}>
        {account && (
          <VerificationSkipDialog
            isVisible={showSkipDialog}
            onPressCancel={onPressSkipCancel}
            onPressConfirm={onPressSkipConfirm}
          />
        )}
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }

  let bodyText
  let firstButton
  const continueButtonDisabled = !phoneNumberInfo.isValidNumber

  if (numberVerified) {
    // Already verified
    bodyText = t('verificationEducation.bodyAlreadyVerified')
    firstButton = (
      <Button
        text={partOfOnboarding ? t('continue') : t('goBack')}
        onPress={onPressContinue}
        type={BtnTypes.ONBOARDING}
        style={styles.startButton}
        disabled={continueButtonDisabled}
        testID="VerificationEducationSkip"
      />
    )
  } else if (!asyncKomenciReadiness.result || hideVerification) {
    bodyText = t('verificationUnavailable')
    firstButton = (
      <Button
        text={t('continue')}
        onPress={onPressContinueWhenVerificationUnavailable}
        type={BtnTypes.ONBOARDING}
        style={styles.startButton}
        disabled={continueButtonDisabled}
        testID="VerificationEducationSkip"
      />
    )
  } else if (shouldUseKomenci || isBalanceSufficient) {
    // Sufficient balance
    bodyText = t(`verificationEducation.${shouldUseKomenci ? 'feelessBody' : 'body'}`)
    firstButton = (
      <Button
        text={
          noActionIsRequired ? t('verificationEducation.resume') : t('verificationEducation.start')
        }
        onPress={onPressStart}
        type={BtnTypes.ONBOARDING}
        style={styles.startButton}
        disabled={continueButtonDisabled}
        testID="VerificationEducationContinue"
      />
    )
  } else {
    // Insufficient balance
    bodyText = t('verificationEducation.bodyInsufficientBalance')
    firstButton = (
      <Button
        text={t('verificationEducation.skipForNow')}
        onPress={onPressSkipConfirm}
        type={BtnTypes.ONBOARDING}
        style={styles.startButton}
        testID="VerificationEducationSkip"
      />
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={headerHeight ? { marginTop: headerHeight } : undefined}
        contentContainerStyle={[styles.scrollContainer, insets && { marginBottom: insets.bottom }]}
      >
        <Text style={styles.header} testID="VerificationEducationHeader">
          {t('verificationEducation.header')}
        </Text>
        <Text style={styles.body}>{bodyText}</Text>
        <PhoneNumberInput
          label={t('phoneNumber')}
          style={styles.phoneNumber}
          country={country}
          internationalPhoneNumber={phoneNumberInfo.internationalPhoneNumber}
          onPressCountry={onPressCountry}
          onChange={onChangePhoneNumberInput}
        />
        {firstButton}
        <View style={styles.spacer} />
        <TextButton
          testID="doINeedToConfirm"
          style={styles.doINeedToConfirmButton}
          onPress={onPressLearnMore}
        >
          {t('verificationEducation.doINeedToConfirm')}
        </TextButton>
      </ScrollView>
      <Modal
        isVisible={currentState.type === StateType.EnsuringRealHumanUser}
        style={styles.recaptchaModal}
      >
        <TopBarTextButton
          onPress={cancelCaptcha}
          titleStyle={[
            {
              marginTop: insets.top,
              height: headerHeight - insets.top,
            },
            styles.recaptchaClose,
          ]}
          title={t('close')}
        />
        <GoogleReCaptcha
          siteKey={networkConfig.recaptchaSiteKey}
          url={WEB_LINK}
          languageCode={i18n.language}
          onMessage={handleCaptchaResolved}
          style={styles.recaptcha}
        />
      </Modal>
      <VerificationSkipDialog
        isVisible={showSkipDialog}
        onPressCancel={onPressSkipCancel}
        onPressConfirm={onPressSkipConfirm}
      />
      <VerificationLearnMoreDialog
        isVisible={showLearnMoreDialog}
        onPressDismiss={onPressLearnMoreDismiss}
      />
    </View>
  )
}

VerificationEducationScreen.navigationOptions = nuxNavigationOptions

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  recaptchaModal: {
    margin: 0,
    backgroundColor: 'rgba(249, 243, 240, 0.9)',
  },
  recaptchaClose: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    color: colors.dark,
  },
  recaptcha: {
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
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
  spacer: {
    flex: 1,
  },
  doINeedToConfirmButton: {
    textAlign: 'center',
    color: colors.onboardingBrownLight,
    padding: Spacing.Regular16,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
})

export default VerificationEducationScreen
