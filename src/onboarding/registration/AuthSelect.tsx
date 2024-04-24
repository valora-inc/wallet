import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { supportedBiometryTypeSelector } from 'src/app/selectors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { nuxNavigationOptionsOnboarding } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { biometryIconMap } from 'src/onboarding/registration/EnableBiometry'
import { goToNextOnboardingScreen, onboardingPropsSelector } from 'src/onboarding/steps'
import { setCachedPin } from 'src/pincode/PasswordCache'
import {
  DEFAULT_CACHE_ACCOUNT,
  generateRandomPin,
  setPincodeWithBiometry,
} from 'src/pincode/authentication'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { isUserCancelledError } from 'src/storage/keychain'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'

const TAG = 'AuthSelect'

type Props = NativeStackScreenProps<StackParamList, Screens.AuthSelect>

export default function AuthSelect({ navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // This screen would not be displayed if supportedBiometryType were null
  const supportedBiometryType = useSelector(supportedBiometryTypeSelector)
  const onboardingProps = useSelector(onboardingPropsSelector)

  const onPressUsePin = async () => {
    ValoraAnalytics.track(OnboardingEvents.biometry_opt_out)
    goToNextOnboardingScreen({
      firstScreenInCurrentStep: Screens.AuthSelect,
      onboardingProps: { ...onboardingProps, usePin: true },
    })
  }

  const handleNavigateToNextScreen = () => {
    goToNextOnboardingScreen({
      firstScreenInCurrentStep: Screens.AuthSelect,
      onboardingProps,
    })
  }

  const onPressUseBiometry = async () => {
    try {
      ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_approve)
      const randomPin = generateRandomPin()
      setCachedPin(DEFAULT_CACHE_ACCOUNT, randomPin)
      await setPincodeWithBiometry()
      dispatch(setPincodeSuccess(PincodeType.PhoneAuth))
      ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_complete)
      handleNavigateToNextScreen()
    } catch (err) {
      const error = ensureError(err)
      ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_error)
      if (!isUserCancelledError(error)) {
        Logger.error(TAG, 'Error enabling biometry', error)
      }
    }
  }

  return (
    <ScrollView style={styles.contentContainer}>
      <SafeAreaView style={styles.container}>
        {
          <>
            <Text style={styles.title}>{t('authSelect.title')}</Text>
            <Text style={styles.description}>
              {t('authSelect.description', {
                biometryType: t(`biometryType.${supportedBiometryType}`),
              })}
            </Text>
          </>
        }
        <Button
          onPress={onPressUseBiometry}
          text={t('authSelect.cta', {
            biometryType: t(`biometryType.${supportedBiometryType}`),
          })}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING}
          testID="AuthSelect/Biometrics"
          icon={
            supportedBiometryType && (
              <View style={styles.biometryIcon}>{biometryIconMap[supportedBiometryType]}</View>
            )
          }
          style={styles.button}
        />
        <Button
          text={t('authSelect.altCta')}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING_SECONDARY}
          testID="AuthSelect/PIN"
          onPress={onPressUsePin}
          style={styles.button}
        />
      </SafeAreaView>
    </ScrollView>
  )
}

AuthSelect.navigationOptions = nuxNavigationOptionsOnboarding

const styles = StyleSheet.create({
  container: {
    paddingTop: 72,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: Spacing.Regular16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  button: {
    width: '100%',
  },
  title: {
    ...fontStyles.h1,
    marginBottom: Spacing.Regular16,
    textAlign: 'center',
  },
  description: {
    ...fontStyles.regular,
    marginBottom: Spacing.Large32,
    textAlign: 'center',
  },
  biometryIcon: {
    paddingRight: 4,
  },
})
