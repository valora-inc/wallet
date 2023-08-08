import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Times from 'src/icons/Times'
import { useVerifyPhoneNumber } from 'src/keylessBackup/hooks'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton, TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'

function KeylessBackupPhoneCodeInput({
  route,
  navigation,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupPhoneCodeInput>) {
  const { t } = useTranslation()
  const { setSmsCode, verificationStatus } = useVerifyPhoneNumber(
    route.params.e164Number,
    route.params.keylessBackupFlow
  )

  const onPressHelp = () => {
    // TODO(ACT-815): show help bottom sheet
  }

  const onPressClose = () => {
    navigate(
      route.params.keylessBackupFlow === KeylessBackupFlow.Setup
        ? Screens.SetUpKeylessBackup
        : Screens.ImportWallet // TODO(any): use the new restore landing screen once built
    )
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TopBarTextButton
          title={t('phoneVerificationInput.help')}
          testID="KeylessBackupPhoneCodeInputHelp"
          onPress={onPressHelp}
          titleStyle={{ color: colors.onboardingBrownLight }}
        />
      ),
      headerLeft: () => (
        <TopBarIconButton
          testID={'KeylessBackupPhoneCodeInputClose'}
          icon={<Times />}
          onPress={onPressClose}
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
    ...fontStyles.h2,
    textAlign: 'center',
    marginBottom: Spacing.Regular16,
  },
})

export default KeylessBackupPhoneCodeInput
