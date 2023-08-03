import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import { useAuth0 } from 'react-native-auth0'
import { useDispatch } from 'react-redux'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import GoogleIcon from 'src/icons/Google'
import Times from 'src/icons/Times'
import { googleSignInCompleted } from 'src/keylessBackup/slice'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/SignInWithEmail'

type Props = NativeStackScreenProps<StackParamList, Screens.SignInWithEmail>

function SignInWithEmail({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { authorize, getCredentials, clearCredentials } = useAuth0()
  const { keylessBackupFlow } = route.params

  const onPressGoogle = async () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_sign_in_with_google, { keylessBackupFlow })
    try {
      // clear any existing saved credentials
      await clearCredentials()

      Logger.debug(TAG, 'Starting auth0 login')

      await authorize({ scope: 'email', connection: 'google-oauth2' })
      const credentials = await getCredentials()

      if (!credentials) {
        Logger.debug(TAG, 'login cancelled')
        return
      }

      if (!credentials.idToken) {
        throw new Error('got an empty token from auth0')
      }
      navigate(Screens.KeylessBackupPhoneInput, { keylessBackupFlow })
      dispatch(googleSignInCompleted({ idToken: credentials.idToken }))
      ValoraAnalytics.track(KeylessBackupEvents.cab_sign_in_with_google_success, {
        keylessBackupFlow,
      })
    } catch (err) {
      Logger.warn(TAG, 'login failed', err)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{t('signInWithEmail.title')}</Text>
        <Text style={styles.subtitle}>
          {keylessBackupFlow === KeylessBackupFlow.Setup
            ? t('signInWithEmail.subtitle')
            : t('signInWithEmail.subtitleRestore')}
        </Text>
      </ScrollView>
      <Button
        testID="SignInWithEmail/Google"
        onPress={onPressGoogle}
        text={t('signInWithEmail.google')}
        size={BtnSizes.FULL}
        type={BtnTypes.SECONDARY}
        style={styles.button}
        icon={<GoogleIcon />}
        iconMargin={12}
        touchableStyle={styles.buttonTouchable}
      />
    </SafeAreaView>
  )
}

SignInWithEmail.navigationOptions = ({ route }: Props) => ({
  ...emptyHeader,
  headerLeft: () => (
    <TopBarIconButton
      testID="SignInWithEmail/Close"
      icon={<Times />}
      onPress={() => {
        const { keylessBackupFlow } = route.params
        ValoraAnalytics.track(KeylessBackupEvents.cab_sign_in_with_email_screen_cancel, {
          keylessBackupFlow,
        })
        navigate(
          keylessBackupFlow === KeylessBackupFlow.Setup
            ? Screens.SetUpKeylessBackup
            : Screens.ImportWallet // TODO(any): use the new restore landing screen once built
        )
      }}
    />
  ),
})

export default SignInWithEmail

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 36,
  },
  title: {
    ...fontStyles.h2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginVertical: 16,
  },
  button: {
    padding: 24,
  },
  buttonTouchable: {
    justifyContent: 'flex-start',
  },
})
