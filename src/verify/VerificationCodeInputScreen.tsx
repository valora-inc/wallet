import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PhoneVerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import Dialog from 'src/components/Dialog'
import { PHONE_NUMBER_VERIFICATION_CODE_LENGTH } from 'src/config'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { PhoneNumberVerificationStatus, useVerifyPhoneNumber } from 'src/verify/hooks'
import ResendButtonWithDelay from 'src/verify/ResendButtonWithDelay'

function VerificationCodeInputScreen({
  route,
  navigation,
}: StackScreenProps<StackParamList, Screens.VerificationCodeInputScreen>) {
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [code, setCode] = useState('')
  const [codeInputStatus, setCodeInputStatus] = useState(CodeInputStatus.Inputting)

  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()
  const { resendSms, setSmsCode, verificationStatus } = useVerifyPhoneNumber(
    route.params.e164Number,
    route.params.countryCallingCode
  )

  const onResendSms = () => {
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_resend_message)
    resendSms()
  }

  const onPressSkip = () => {
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_input_help_skip)
    navigateHome()
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
          titleStyle={{ color: colors.goldDark }}
        />
      ),
      headerLeft: () => <BackButton />,
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
      <KeyboardAvoidingView
        style={[
          styles.keyboardAvoidingContainer,
          headerHeight ? { marginTop: headerHeight } : undefined,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="always"
          >
            <Text style={styles.body}>
              {t('phoneVerificationInput.description', { phoneNumber: route.params.e164Number })}
            </Text>
            <CodeInput
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
            <View style={styles.bottomButtonContainer}>
              <ResendButtonWithDelay onPress={onResendSms} />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <Dialog
        testID="PhoneVerificationInputHelpDialog"
        title={t('phoneVerificationInput.helpDialog.title')}
        isVisible={showHelpDialog}
        actionText={t('phoneVerificationInput.helpDialog.dismiss')}
        actionPress={onPressHelpDismiss}
        secondaryActionPress={onPressSkip}
        secondaryActionText={t('phoneVerificationInput.helpDialog.skip')}
        onBackgroundPress={onPressHelpDismiss}
      >
        {t('phoneVerificationInput.helpDialog.body')}
      </Dialog>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flex: 1,
    padding: Spacing.Thick24,
  },
  contentContainer: {
    flexGrow: 1,
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
  codeInput: {
    marginHorizontal: Spacing.Thick24,
  },
  bottomButtonContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
})

export default VerificationCodeInputScreen
