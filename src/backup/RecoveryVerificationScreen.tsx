import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeyshareEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import NumberKeypad from 'src/components/NumberKeypad'
import i18n from 'src/i18n'
import { verificationCode } from 'src/images/Images'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useCapsule } from 'src/web3/hooks'

type Props = {} & StackScreenProps<StackParamList, Screens.RecoveryVerificationScreen>

const RecoveryVerificationScreen = (_props: Props) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<boolean>(false)
  const [code, setCode] = useState<string>()
  const { refreshRecoveryKeyshare } = useCapsule()

  const handleDigitPress = (digit: number) => {
    setCode(`${code ?? ''}${digit}`)
  }

  const handleBackspace = () => {
    if (!code) return
    setCode(code.slice(0, code.length - 1))
  }

  const handleSubmit = async () => {
    if (code?.length == 6) {
      setLoading(true)
      await refreshRecoveryKeyshare(code)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.topContainer}>
        <Image source={verificationCode} style={styles.codeImage} />
        <View style={styles.textBox}>
          <Text style={styles.header}>{t('recoveryVerificationPrompt')}</Text>
          <Text style={[!code ? styles.placeholder : styles.verifyLabel]}>
            {code ?? t('signUp.verifyPlaceholder')}
          </Text>
          {loading && <Text>{t('refreshInProgress')}</Text>}
        </View>
      </View>
      <Button size={BtnSizes.FULL} onPress={handleSubmit} text={'Continue'} showLoading={loading} />
      <NumberKeypad
        digitColor={Colors.dark}
        onDigitPress={handleDigitPress}
        onBackspacePress={handleBackspace}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 24,
  },
  topContainer: {
    flexGrow: 1,
  },
  codeImage: {
    alignSelf: 'center',
    marginVertical: 24,
  },
  textBox: {
    alignSelf: 'center',
  },
  header: {
    ...fontStyles.hero,
    fontSize: 24,
    marginBottom: variables.headerPadding,
  },
  placeholder: {
    ...fontStyles.hero,
    color: Colors.gray2,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
  verifyLabel: {
    ...fontStyles.hero,
    color: Colors.dark,
  },
})

RecoveryVerificationScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.RecoveryVerificationScreen>
}) => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={KeyshareEvents.export_user_keyshare_cancel} />,
    headerTitle: i18n.t('recoveryKeyshare'),
  }
}

export default RecoveryVerificationScreen
