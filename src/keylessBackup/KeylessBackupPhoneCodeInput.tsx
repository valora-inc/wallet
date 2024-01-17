import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeylessBackupEvents } from 'src/analytics/Events'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { useVerifyPhoneNumber } from 'src/keylessBackup/hooks'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'

function KeylessBackupPhoneCodeInput({
  route,
  navigation,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupPhoneCodeInput>) {
  const { t } = useTranslation()
  const { e164Number, keylessBackupFlow } = route.params
  const { setSmsCode, verificationStatus } = useVerifyPhoneNumber(e164Number, keylessBackupFlow)

  const onPressHelp = () => {
    // TODO(ACT-815): show help bottom sheet
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
          })
        }}
        title={<Text style={styles.title}>{t('phoneVerificationInput.title')}</Text>}
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
})

export default KeylessBackupPhoneCodeInput
