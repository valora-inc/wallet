import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { PhoneVerificationEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate, popToScreen } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { goToNextOnboardingScreen, onboardingPropsSelector } from 'src/onboarding/steps'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import { useVerifyPhoneNumber } from 'src/verify/hooks'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'

function VerificationCodeInputScreen({
  route,
  navigation,
}: NativeStackScreenProps<StackParamList, Screens.VerificationCodeInputScreen>) {
  const infoBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()
  const { resendSms, setSmsCode, verificationStatus } = useVerifyPhoneNumber(
    route.params.e164Number,
    route.params.countryCallingCode
  )
  const onboardingProps = useSelector(onboardingPropsSelector)

  const onResendSms = () => {
    AppAnalytics.track(PhoneVerificationEvents.phone_verification_resend_message)
    resendSms()
  }

  const onPressHelp = () => {
    AppAnalytics.track(PhoneVerificationEvents.phone_verification_input_help)
    infoBottomSheetRef.current?.snapToIndex(0)
  }

  const onPressHelpDismiss = () => {
    AppAnalytics.track(PhoneVerificationEvents.phone_verification_input_help_continue)
    infoBottomSheetRef.current?.close()
  }

  useLayoutEffect(() => {
    const registrationStep = route.params.registrationStep
    const title = registrationStep
      ? () => (
          <HeaderTitleWithSubtitle
            title={t('phoneVerificationInput.title')}
            subTitle={t('registrationSteps', {
              step: registrationStep.step,
              totalSteps: registrationStep.totalSteps,
            })}
          />
        )
      : t('phoneVerificationInput.title')

    navigation.setOptions({
      headerTitle: title,
      headerRight: () => (
        <TopBarTextButton
          title={t('phoneVerificationInput.help')}
          testID="PhoneVerificationHelpHeader"
          onPress={onPressHelp}
          titleStyle={{ color: colors.navigationTopPrimary }}
        />
      ),
      headerLeft: () => <BackButton color={colors.navigationTopPrimary} />,
      headerTransparent: true,
    })
  }, [navigation, route.params])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <VerificationCodeInput
        phoneNumber={route.params.e164Number}
        verificationStatus={verificationStatus}
        setSmsCode={setSmsCode}
        onResendSms={onResendSms}
        onSuccess={() => {
          if (route.params.hasOnboarded) {
            const routes = navigation.getState().routes
            // if not from onboarding, go back to the screen where phone
            // verification was started, which is 2 screens back. If no screen
            // is found, go to home screen
            const prevRoute = routes[routes.length - 3]
            if (prevRoute?.name) {
              popToScreen(prevRoute.name)
            } else {
              navigate(Screens.TabHome)
            }
          } else {
            // if onboarding, continue with the next onboarding screen
            goToNextOnboardingScreen({
              firstScreenInCurrentStep: Screens.VerificationStartScreen,
              onboardingProps,
            })
          }
        }}
        containerStyle={{ marginTop: headerHeight }}
      />
      <BottomSheet
        forwardedRef={infoBottomSheetRef}
        title={t('phoneVerificationInput.helpDialog.title')}
        description={t('phoneVerificationInput.helpDialog.body')}
        testId="PhoneVerificationInputHelpDialog"
      >
        <Button
          text={t('dismiss')}
          onPress={onPressHelpDismiss}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          style={styles.dismissHelpButton}
        />
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dismissHelpButton: {
    marginTop: Spacing.Thick24,
  },
})

export default VerificationCodeInputScreen
