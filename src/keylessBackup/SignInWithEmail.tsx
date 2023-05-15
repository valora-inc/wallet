import { GoogleSignin } from '@react-native-google-signin/google-signin'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import { useDispatch } from 'react-redux'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import GoogleIcon from 'src/icons/Google'
import Times from 'src/icons/Times'
import { googleSignInStarted } from 'src/keylessBackup/slice'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'

const TAG = 'SignInWithEmail'

async function onPressGoogle() {
  ValoraAnalytics.track(KeylessBackupEvents.sign_in_with_google)
  // TODO(satish): move this to a saga
  GoogleSignin.configure({
    webClientId: '<client id from google-services.json>',
  })
  // sign out first so any saved session is not used, which skips asking for the
  // account to use
  await GoogleSignin.signOut()
  try {
    await GoogleSignin.hasPlayServices()
    const userInfo = await GoogleSignin.signIn()
    Logger.debug(TAG, 'userInfo:', userInfo)
  } catch (err) {
    Logger.warn(TAG, 'google sign in failed', err)
  }
}

function onPressCancel() {
  ValoraAnalytics.track(KeylessBackupEvents.sign_in_with_email_screen_cancel)
  navigateHome({ params: { initialScreen: Screens.Settings } })
}

function SignInWithEmail() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const onPressGoogle = () => {
    ValoraAnalytics.track(KeylessBackupEvents.sign_in_with_google)
    dispatch(googleSignInStarted())
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{t('signInWithEmail.title')}</Text>
        <Text style={styles.subtitle}>{t('signInWithEmail.subtitle')}</Text>
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

SignInWithEmail.navigationOptions = () => ({
  ...emptyHeader,
  headerLeft: () => (
    <TopBarIconButton
      style={styles.cancelButton}
      icon={<Times height={16} />}
      onPress={onPressCancel}
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
  cancelButton: {
    marginLeft: 16,
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
