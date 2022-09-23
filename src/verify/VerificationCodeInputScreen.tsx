import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import Dialog from 'src/components/Dialog'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const VERIFICATION_CODE_LENGTH = 8

function VerificationCodeInputScreen({
  route,
  navigation,
}: StackScreenProps<StackParamList, Screens.VerificationCodeInputScreen>) {
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [code, setCode] = useState('')
  const [codeInputStatus, setCodeInputStatus] = useState(CodeInputStatus.Inputting)

  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()

  const onPressSkip = () => {
    navigateHome()
  }

  const onPressHelp = () => {
    setShowHelpDialog(true)
  }

  const onPressHelpDismiss = () => {
    setShowHelpDialog(false)
  }

  useLayoutEffect(() => {
    const registrationStep = route.params.registrationStep
    const title = !registrationStep
      ? t('phoneVerificationInput.title')
      : () => (
          <HeaderTitleWithSubtitle
            title={t('phoneVerificationInput.title')}
            subTitle={t('registrationSteps', {
              step: registrationStep.step,
              totalSteps: registrationStep.totalSteps,
            })}
          />
        )

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
    if (code.length === VERIFICATION_CODE_LENGTH) {
      setCodeInputStatus(CodeInputStatus.Processing)
      // TODO dispatch verifying phone code action
    }
  }, [code])

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
          status={codeInputStatus}
          inputValue={code}
          inputPlaceholder={t('phoneVerificationInput.codeInputPlaceholder')}
          onInputChange={setCode}
          shouldShowClipboard={(content) =>
            !!content && content.length === VERIFICATION_CODE_LENGTH
          }
          testID="PhoneVerificationCode"
          style={{ marginHorizontal: Spacing.Thick24 }}
        />
      </KeyboardAwareScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: Spacing.Thick24,
    width: '100%',
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
})

export default VerificationCodeInputScreen
