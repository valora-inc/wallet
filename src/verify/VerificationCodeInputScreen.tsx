import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { PhoneVerificationEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import InfoBottomSheet from 'src/components/InfoBottomSheet'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { useVerifyPhoneNumber } from 'src/verify/hooks'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'

function VerificationCodeInputScreen({
  route,
  navigation,
}: NativeStackScreenProps<StackParamList, Screens.VerificationCodeInputScreen>) {
  const nextScreen = route.params.verificationCompletionScreen
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()
  const { resendSms, setSmsCode, verificationStatus } = useVerifyPhoneNumber(
    route.params.e164Number,
    route.params.countryCallingCode
  )

  const onResendSms = () => {
    AppAnalytics.track(PhoneVerificationEvents.phone_verification_resend_message)
    resendSms()
  }

  const onPressHelp = () => {
    AppAnalytics.track(PhoneVerificationEvents.phone_verification_input_help)
    setShowHelpDialog(true)
  }

  const onPressHelpDismiss = () => {
    AppAnalytics.track(PhoneVerificationEvents.phone_verification_input_help_continue)
    setShowHelpDialog(false)
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
          titleStyle={{ color: colors.black }}
        />
      ),
      headerLeft: () => <BackButton color={colors.black} />,
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
          navigate(nextScreen)
        }}
        containerStyle={{ marginTop: headerHeight }}
      />
      <InfoBottomSheet
        isVisible={showHelpDialog}
        title={t('phoneVerificationInput.helpDialog.title')}
        body={t('phoneVerificationInput.helpDialog.body')}
        onDismiss={onPressHelpDismiss}
        testID="PhoneVerificationInputHelpDialog"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default VerificationCodeInputScreen
