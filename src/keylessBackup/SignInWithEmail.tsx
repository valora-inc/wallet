import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import { useAuth0 } from 'react-native-auth0'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import GoogleIcon from 'src/icons/Google'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { googleSignInCompleted, keylessBackupStarted } from 'src/keylessBackup/slice'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/SignInWithEmail'

type Props = NativeStackScreenProps<StackParamList, Screens.SignInWithEmail>

function SignInWithEmail({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { authorize, getCredentials, clearCredentials } = useAuth0()
  const { keylessBackupFlow, origin } = route.params
  const [loading, setLoading] = useState(false)

  const onPressGoogle = async () => {
    setLoading(true)
    dispatch(
      keylessBackupStarted({
        keylessBackupFlow,
      })
    )
    ValoraAnalytics.track(KeylessBackupEvents.cab_sign_in_with_google, { keylessBackupFlow })
    try {
      // clear any existing saved credentials
      await clearCredentials()

      Logger.debug(TAG, 'Starting auth0 login')

      await authorize({ scope: 'email', connection: 'google-oauth2' })
      const credentials = await getCredentials()

      if (!credentials) {
        Logger.debug(TAG, 'login cancelled')
        setLoading(false)
        return
      }

      if (!credentials.idToken) {
        throw new Error('got an empty token from auth0')
      }
      navigate(Screens.KeylessBackupPhoneInput, { keylessBackupFlow, origin })
      dispatch(googleSignInCompleted({ idToken: credentials.idToken }))
      ValoraAnalytics.track(KeylessBackupEvents.cab_sign_in_with_google_success, {
        keylessBackupFlow,
      })
      setTimeout(() => {
        // to avoid screen flash
        setLoading(false)
      }, 1000)
    } catch (err) {
      Logger.warn(TAG, 'login failed', err)
      setLoading(false)
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
        touchableStyle={[styles.buttonTouchable, !loading && { justifyContent: 'flex-start' }]}
        showLoading={loading}
        disabled={loading}
      />
    </SafeAreaView>
  )
}

SignInWithEmail.navigationOptions = ({ route }: Props) => ({
  ...emptyHeader,
  headerLeft: () => (
    <KeylessBackupCancelButton
      flow={route.params.keylessBackupFlow}
      eventName={KeylessBackupEvents.cab_sign_in_with_email_screen_cancel}
    />
  ),
})

export default SignInWithEmail

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    height: '100%',
  },
  scrollContainer: {
    padding: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
    color: Colors.black,
  },
  subtitle: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    paddingVertical: Spacing.Regular16,
    color: Colors.black,
  },
  button: {
    padding: Spacing.Thick24,
  },
  buttonTouchable: {
    backgroundColor: Colors.gray1,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 100,
  },
})
