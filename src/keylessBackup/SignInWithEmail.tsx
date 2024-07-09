import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth0 } from 'react-native-auth0'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CustomHeader from 'src/components/header/CustomHeader'
import GoogleIcon from 'src/icons/Google'
import { email } from 'src/images/Images'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { googleSignInCompleted, keylessBackupStarted } from 'src/keylessBackup/slice'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import {
  getOnboardingStepValues,
  goToNextOnboardingScreen,
  onboardingPropsSelector,
} from 'src/onboarding/steps'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/SignInWithEmail'

function SignInWithEmailBottomSheet({
  keylessBackupFlow,
  origin,
  bottomSheetRef,
}: {
  keylessBackupFlow: KeylessBackupFlow
  origin: KeylessBackupOrigin
  bottomSheetRef: React.RefObject<BottomSheetRefType>
}) {
  const { t } = useTranslation()
  const onboardingProps = useSelector(onboardingPropsSelector)
  const onPressContinue = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_setup_recovery_phrase)
    bottomSheetRef.current?.close()
    goToNextOnboardingScreen({
      firstScreenInCurrentStep: Screens.SignInWithEmail,
      onboardingProps: { ...onboardingProps, showRecoveryPhraseEducation: true },
    })
  }

  const onPressSkip = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_sign_in_with_email_screen_skip, {
      keylessBackupFlow,
      origin,
    })
    goToNextOnboardingScreen({
      firstScreenInCurrentStep: Screens.SignInWithEmail,
      onboardingProps,
    })
  }

  return (
    <BottomSheet
      forwardedRef={bottomSheetRef}
      title={t('signInWithEmail.bottomSheet.title')}
      titleStyle={styles.bottomSheetTitle}
      testId="KeylessBackupSignInWithEmail/BottomSheet"
    >
      <Text style={styles.bottomSheetDescription}>
        {t('signInWithEmail.bottomSheet.description')}
      </Text>
      <View style={styles.bottomSheetButtonContainer}>
        <Button
          testID="BottomSheet/Continue"
          onPress={onPressContinue}
          text={t('signInWithEmail.bottomSheet.continue')}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
        />
        <Button
          testID="BottomSheet/Skip"
          onPress={onPressSkip}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          text={t('signInWithEmail.bottomSheet.skip')}
        />
      </View>
    </BottomSheet>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.SignInWithEmail>

function SignInWithEmail({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { authorize, getCredentials, clearCredentials } = useAuth0()
  const { keylessBackupFlow, origin } = route.params
  const [loading, setLoading] = useState(false)
  const onboardingProps = useSelector(onboardingPropsSelector)
  const { step, totalSteps } = getOnboardingStepValues(Screens.SignInWithEmail, onboardingProps)
  const { bottom } = useSafeAreaInsets()
  const insetsStyle = {
    paddingBottom: Math.max(0, 40 - bottom),
  }

  const isSetup = keylessBackupFlow === KeylessBackupFlow.Setup
  const isSetupInOnboarding =
    keylessBackupFlow === KeylessBackupFlow.Setup && origin === KeylessBackupOrigin.Onboarding

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const onPressSignInAnotherWay = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_sign_in_another_way, {
      keylessBackupFlow,
      origin,
    })
    bottomSheetRef.current?.snapToIndex(0)
  }

  const onPressGoogle = async () => {
    setLoading(true)
    dispatch(
      keylessBackupStarted({
        keylessBackupFlow,
      })
    )
    ValoraAnalytics.track(KeylessBackupEvents.cab_sign_in_with_google, {
      keylessBackupFlow,
      origin,
    })
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
        origin,
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
      <CustomHeader
        style={styles.header}
        left={
          origin === KeylessBackupOrigin.Settings ? (
            <KeylessBackupCancelButton
              flow={keylessBackupFlow}
              origin={origin}
              eventName={KeylessBackupEvents.cab_sign_in_with_email_screen_cancel}
            />
          ) : (
            // This includes Onboarding and Restore
            <BackButton
              eventName={KeylessBackupEvents.cab_sign_in_with_email_screen_cancel}
              eventProperties={{
                keylessBackupFlow,
                origin,
              }}
            />
          )
        }
        title={
          isSetupInOnboarding ? (
            <HeaderTitleWithSubtitle
              title={t('keylessBackupSetupTitle')}
              subTitle={t('registrationSteps', { step, totalSteps })}
            />
          ) : null
        }
      />
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.imageContainer}>
          <Image testID="Email" source={email} />
        </View>
        <Text style={styles.title}>{t('signInWithEmail.title')}</Text>
        <Text style={styles.subtitle}>
          {isSetup ? t('signInWithEmail.subtitle') : t('signInWithEmail.subtitleRestore')}
        </Text>
      </ScrollView>
      <View
        style={[
          styles.buttonContainer,
          isSetupInOnboarding ? insetsStyle : { marginBottom: Spacing.Thick24 },
        ]}
      >
        <Button
          testID="SignInWithEmail/Google"
          onPress={onPressGoogle}
          text={t('signInWithEmail.google')}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          icon={<GoogleIcon color={Colors.white} />}
          iconMargin={12}
          showLoading={loading}
          disabled={loading}
        />
        {isSetupInOnboarding && (
          <Button
            testID="SignInWithEmail/SignInAnotherWay"
            onPress={onPressSignInAnotherWay}
            size={BtnSizes.FULL}
            type={BtnTypes.SECONDARY}
            text={t('signInWithEmail.signInAnotherWay')}
          />
        )}
      </View>
      {isSetupInOnboarding && (
        <SignInWithEmailBottomSheet
          keylessBackupFlow={keylessBackupFlow}
          origin={origin}
          bottomSheetRef={bottomSheetRef}
        />
      )}
    </SafeAreaView>
  )
}

export default SignInWithEmail

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    height: '100%',
  },
  scrollContainer: {
    padding: Spacing.Thick24,
  },
  header: {
    paddingHorizontal: variables.contentPadding,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleMedium,
    textAlign: 'center',
    color: Colors.black,
  },
  subtitle: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    paddingVertical: Spacing.Regular16,
    color: Colors.black,
  },
  buttonContainer: {
    gap: Spacing.Smallest8,
    marginHorizontal: Spacing.Thick24,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    textAlign: 'center',
    color: Colors.black,
  },
  bottomSheetDescription: {
    ...typeScale.bodyMedium,
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: Spacing.Small12,
    textAlign: 'center',
    color: Colors.black,
  },
  bottomSheetButtonContainer: {
    gap: Spacing.Smallest8,
  },
})
