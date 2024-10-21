import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth0 } from 'react-native-auth0'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { KeylessBackupEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CustomHeader from 'src/components/header/CustomHeader'
import AppleIcon from 'src/icons/Apple'
import GoogleIcon from 'src/icons/Google'
import { email } from 'src/images/Images'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { auth0SignInCompleted, keylessBackupStarted } from 'src/keylessBackup/slice'
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
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import colors from 'src/styles/colors'

const TAG = 'keylessBackup/SignInWithEmail'

function SignInWithEmailBottomSheet({
  keylessBackupFlow,
  origin,
  bottomSheetRef,
}: {
  keylessBackupFlow: KeylessBackupFlow
  origin: KeylessBackupOrigin
  bottomSheetRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()
  const onboardingProps = useSelector(onboardingPropsSelector)

  const onPressContinue = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_setup_recovery_phrase)
    bottomSheetRef.current?.close()
    navigate(Screens.AccountKeyEducation, { origin: 'cabOnboarding' })
  }

  const onPressSkip = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_sign_in_with_email_screen_skip, {
      keylessBackupFlow,
      origin,
    })
    goToNextOnboardingScreen({
      firstScreenInCurrentStep: Screens.SignInWithEmail,
      onboardingProps,
    })
    bottomSheetRef.current?.close()
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
type OAuthProvider = 'google-oauth2' | 'apple'
type Props = NativeStackScreenProps<StackParamList, Screens.SignInWithEmail>

function SignInWithEmail({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const showApple = getFeatureGate(StatsigFeatureGates.SHOW_APPLE_IN_CAB)
  const { authorize, getCredentials, clearCredentials } = useAuth0()
  const { keylessBackupFlow, origin } = route.params
  const [loading, setLoading] = useState<null | OAuthProvider>(null)
  const onboardingProps = useSelector(onboardingPropsSelector)
  const { step, totalSteps } = getOnboardingStepValues(Screens.SignInWithEmail, onboardingProps)
  const { bottom } = useSafeAreaInsets()
  const insetsStyle = {
    paddingBottom: Math.max(0, 40 - bottom),
  }
  const address = useSelector(walletAddressSelector)

  const isSetup = keylessBackupFlow === KeylessBackupFlow.Setup
  const isSetupInOnboarding =
    keylessBackupFlow === KeylessBackupFlow.Setup && origin === KeylessBackupOrigin.Onboarding

  const bottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const onPressSignInAnotherWay = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_sign_in_another_way, {
      keylessBackupFlow,
      origin,
    })
    bottomSheetRef.current?.snapToIndex(0)
  }

  const onPressSignIn = async (provider: OAuthProvider) => {
    setLoading(provider)
    dispatch(
      keylessBackupStarted({
        keylessBackupFlow,
      })
    )
    AppAnalytics.track(KeylessBackupEvents.cab_sign_in_start, {
      keylessBackupFlow,
      origin,
      provider,
    })
    try {
      // clear any existing saved credentials
      await clearCredentials()

      Logger.debug(TAG, 'Starting auth0 login')

      await authorize({ scope: 'email', connection: provider })
      const credentials = await getCredentials()

      if (!credentials) {
        Logger.debug(TAG, 'login cancelled')
        setLoading(null)
        return
      }

      if (!credentials.idToken) {
        throw new Error('got an empty token from auth0')
      }
      navigate(Screens.KeylessBackupPhoneInput, { keylessBackupFlow, origin })
      dispatch(auth0SignInCompleted({ idToken: credentials.idToken }))
      AppAnalytics.track(KeylessBackupEvents.cab_sign_in_success, {
        keylessBackupFlow,
        origin,
        provider,
      })
      setTimeout(() => {
        // to avoid screen flash
        setLoading(null)
      }, 1000)
    } catch (err) {
      Logger.warn(TAG, 'login failed', err)
      setLoading(null)
    }
  }

  if (!address) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator testID="loadingTransferStatus" size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
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
          onPress={() => onPressSignIn('google-oauth2')}
          text={t('signInWithEmail.google')}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          icon={<GoogleIcon color={Colors.black} />}
          iconMargin={10}
          showLoading={loading === 'google-oauth2'}
          disabled={!!loading}
        />
        {showApple && (
          <Button
            testID="SignInWithEmail/Apple"
            onPress={() => onPressSignIn('apple')}
            text={t('signInWithEmail.apple')}
            size={BtnSizes.FULL}
            type={BtnTypes.SECONDARY}
            icon={<AppleIcon color={Colors.black} />}
            iconMargin={10}
            showLoading={loading === 'apple'}
            disabled={!!loading}
          />
        )}
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
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
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
