import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import TextButton from 'src/components/TextButton'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { useVerifyPhoneNumber } from 'src/keylessBackup/hooks'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'

function HelpInfoBottomSheet({
  onPressHelpGoBack,
  onPressHelpSkip,
  bottomSheetRef,
}: {
  onPressHelpGoBack: () => void
  onPressHelpSkip: () => void
  bottomSheetRef: React.RefObject<BottomSheetRefType>
}) {
  const { t } = useTranslation()
  return (
    <BottomSheet
      forwardedRef={bottomSheetRef}
      title={t('phoneVerificationInput.helpDialog.title')}
      titleStyle={styles.bottomSheetTitle}
      testId="KeylessBackupPhoneCodeInput/HelpInfoBottomSheet"
    >
      <View style={styles.bottomSheetView}>
        <Text style={styles.bottomSheetBody}>{t('phoneVerificationInput.helpDialog.body')}</Text>
        <View style={styles.buttonContainer}>
          <TextButton
            onPress={onPressHelpSkip}
            testID="KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/Skip"
            style={styles.skipButton}
          >
            {t('phoneVerificationInput.helpDialog.skip')}
          </TextButton>
          <TextButton
            onPress={onPressHelpGoBack}
            testID="KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/GoBack"
            style={styles.goBackButton}
          >
            {t('phoneVerificationInput.helpDialog.dismiss')}
          </TextButton>
        </View>
      </View>
    </BottomSheet>
  )
}

function KeylessBackupPhoneCodeInput({
  route,
  navigation,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupPhoneCodeInput>) {
  const { t } = useTranslation()
  const { e164Number, keylessBackupFlow } = route.params
  const { setSmsCode, verificationStatus } = useVerifyPhoneNumber(e164Number, keylessBackupFlow)

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const onPressHelp = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_phone_verification_help, { keylessBackupFlow })
    bottomSheetRef.current?.snapToIndex(0)
  }

  const onPressHelpGoBack = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_phone_verification_help_go_back, {
      keylessBackupFlow,
    })
    bottomSheetRef.current?.close()
  }

  const onPressHelpSkip = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_phone_verification_help_skip, {
      keylessBackupFlow,
    })
    keylessBackupFlow === KeylessBackupFlow.Setup ? navigateHome() : navigate(Screens.ImportSelect)
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TopBarTextButton
          title={t('phoneVerificationInput.help')}
          testID="KeylessBackupPhoneCodeInputHelp"
          onPress={onPressHelp}
          titleStyle={styles.help}
        />
      ),
      headerLeft: () => (
        <KeylessBackupCancelButton
          flow={keylessBackupFlow}
          eventName={KeylessBackupEvents.cab_enter_phone_code_cancel}
        />
      ),
    })
  })

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <VerificationCodeInput
        phoneNumber={route.params.e164Number}
        verificationStatus={verificationStatus}
        setSmsCode={setSmsCode}
        onSuccess={() => {
          navigate(Screens.KeylessBackupProgress, {
            keylessBackupFlow: route.params.keylessBackupFlow,
            origin: route.params.origin,
          })
        }}
        title={<Text style={styles.title}>{t('phoneVerificationInput.title')}</Text>}
      />
      <HelpInfoBottomSheet
        onPressHelpGoBack={onPressHelpGoBack}
        onPressHelpSkip={onPressHelpSkip}
        bottomSheetRef={bottomSheetRef}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
    color: colors.black,
    marginBottom: Spacing.Regular16,
  },
  help: {
    color: colors.primary,
    ...typeScale.labelSemiBoldMedium,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    textAlign: 'center',
  },
  bottomSheetView: {
    paddingHorizontal: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  bottomSheetBody: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 37,
    marginBottom: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 96,
  },
  goBackButton: {
    color: colors.primary,
  },
  skipButton: {
    color: colors.gray4,
  },
})

export default KeylessBackupPhoneCodeInput
