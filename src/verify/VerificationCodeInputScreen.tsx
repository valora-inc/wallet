import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PhoneVerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import InfoBottomSheet from 'src/components/InfoBottomSheet'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { PHONE_NUMBER_VERIFICATION_CODE_LENGTH } from 'src/config'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import {
  PhoneNumberVerificationStatus,
  useAndroidSmsCodeRetriever,
  useVerifyPhoneNumber,
} from 'src/verify/hooks'
import ResendButtonWithDelay from 'src/verify/ResendButtonWithDelay'

function VerificationCodeInputScreen({
  route,
  navigation,
}: NativeStackScreenProps<StackParamList, Screens.VerificationCodeInputScreen>) {
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [code, setCode] = useState('')
  const [codeInputStatus, setCodeInputStatus] = useState(CodeInputStatus.Inputting)

  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()
  const { resendSms, setSmsCode, verificationStatus } = useVerifyPhoneNumber(
    route.params.e164Number,
    route.params.countryCallingCode
  )
  // Android uses the SMS Retriever API to automatically fill in the verification code
  useAndroidSmsCodeRetriever(setCode)

  const onResendSms = () => {
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_resend_message)
    resendSms()
  }

  const onPressHelp = () => {
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_input_help)
    setShowHelpDialog(true)
  }

  const onPressHelpDismiss = () => {
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_input_help_continue)
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
          titleStyle={{ color: colors.onboardingBrownLight }}
        />
      ),
      headerLeft: () => <BackButton color={colors.onboardingBrownLight} />,
      headerTransparent: true,
    })
  }, [navigation, route.params])

  useEffect(() => {
    if (code.length === PHONE_NUMBER_VERIFICATION_CODE_LENGTH) {
      setCodeInputStatus(CodeInputStatus.Processing)
      setSmsCode(code)
    }
  }, [code])

  useEffect(() => {
    if (verificationStatus === PhoneNumberVerificationStatus.SUCCESSFUL) {
      setCodeInputStatus(CodeInputStatus.Accepted)
      setTimeout(() => {
        navigate(Screens.OnboardingSuccessScreen)
      }, 500)
    } else if (verificationStatus === PhoneNumberVerificationStatus.FAILED) {
      setCodeInputStatus(CodeInputStatus.Error)
    }
  }, [verificationStatus])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAwareScrollView
        style={[styles.scrollContainer, headerHeight ? { marginTop: headerHeight } : undefined]}
        keyboardShouldPersistTaps="always"
      >
        <Text style={styles.body}>
          {t('phoneVerificationInput.description', { phoneNumber: route.params.e164Number })}
        </Text>
        <CodeInput
          autoFocus
          status={codeInputStatus}
          inputValue={code}
          inputPlaceholder={t('phoneVerificationInput.codeInputPlaceholder')}
          onInputChange={setCode}
          shouldShowClipboard={(content) =>
            !!content && content.length === PHONE_NUMBER_VERIFICATION_CODE_LENGTH
          }
          testID="PhoneVerificationCode"
          style={styles.codeInput}
        />
      </KeyboardAwareScrollView>
      <View style={styles.resendButtonContainer}>
        <ResendButtonWithDelay onPress={onResendSms} />
      </View>
      <KeyboardSpacer />
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

VerificationCodeInputScreen.navigationOptions = {
  headerStyle: {
    backgroundColor: colors.onboardingBackground,
  },
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    flex: 1,
    padding: Spacing.Thick24,
    width: '100%',
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
    textAlign: 'center',
  },
  codeInput: {
    marginHorizontal: Spacing.Thick24,
  },
  resendButtonContainer: {
    padding: Spacing.Thick24,
    alignItems: 'center',
  },
})

export default VerificationCodeInputScreen
