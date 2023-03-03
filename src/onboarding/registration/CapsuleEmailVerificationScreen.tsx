import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import NumberKeypad from 'src/components/NumberKeypad'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { useCapsule } from 'src/web3/hooks'
type RouteProps = StackScreenProps<StackParamList, Screens.CapsuleOAuth>
type Props = RouteProps

const TAG = 'capsule/capsule'
function CapsuleEmailVerificationScreen({ route, navigation }: Props) {
  const { t } = useTranslation()
  const { isExistingUser } = route.params || {}
  const { verify, loginWithKeyshare } = useCapsule()

  const headerHeight = useHeaderHeight()

  const [code, setCode] = useState<string>()

  const handleDigitPress = (digit: number) => {
    setCode(`${code ?? ''}${digit}`)
  }

  const handleBackspace = () => {
    setCode(code.slice(0, code.length - 1))
  }

  const handleResend = () => {
    Logger.debug(TAG, '@handleResend', 'Not Implemented')
  }

  useEffect(() => {
    async function callVerification() {
      if (!code) return
      if (isExistingUser) {
        await loginWithKeyshare(code)
      } else {
        await verify(code)
      }
    }
    void callVerification()
  }, [code])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Logo type={LogoTypes.LIGHT} />,
      headerLeft: () => <BackButton color={Colors.light} />,
    })
  }, [navigation, route.params])

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
        style={[headerHeight ? { marginTop: headerHeight } : undefined, styles.accessibleView]}
      >
        <View style={styles.inputGroup}>
          <Text style={styles.verifyLabel}>{t('signUp.verifyLabel')}</Text>
          <Text style={[!code ? styles.placeholder : styles.verifyLabel]}>
            {code ?? t('signUp.verifyPlaceholder')}
          </Text>
        </View>
        <Button
          style={styles.resendButton}
          type={BtnTypes.ONBOARDING_PASSIVE}
          size={BtnSizes.MEDIUM}
          text={`${t('signUp.resend')} (0)`}
          onPress={handleResend}
        />
        <NumberKeypad
          digitColor={Colors.light}
          onDigitPress={handleDigitPress}
          onBackspacePress={handleBackspace}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greenUI,
  },
  accessibleView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  verifyLabel: {
    ...fontStyles.hero,
    color: Colors.light,
  },
  placeholder: {
    ...fontStyles.hero,
    color: Colors.greenFaint,
  },
  resendButton: {
    justifyContent: 'center',
  },
})

CapsuleEmailVerificationScreen.navigationOptions = nuxNavigationOptions
export default CapsuleEmailVerificationScreen
