import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { KeylessBackupEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import TextButton from 'src/components/TextButton'
import CustomHeader from 'src/components/header/CustomHeader'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { useVerifyPhoneNumber } from 'src/keylessBackup/hooks'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { getOnboardingStepValues, onboardingPropsSelector } from 'src/onboarding/steps'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'

function HelpInfoBottomSheet({
  bottomSheetRef,
  keylessBackupFlow,
  origin,
}: {
  bottomSheetRef: React.RefObject<BottomSheetModalRefType>
  keylessBackupFlow: KeylessBackupFlow
  origin: KeylessBackupOrigin
}) {
  const { t } = useTranslation()

  const onGoBack = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_phone_verification_help_go_back, {
      keylessBackupFlow,
      origin,
    })
    bottomSheetRef.current?.close()
  }

  const onSkip = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_phone_verification_help_skip, {
      keylessBackupFlow,
      origin,
    })
    keylessBackupFlow === KeylessBackupFlow.Setup ? navigateHome() : navigate(Screens.ImportSelect)
  }

  const onUseRecoveryPhrase = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_phone_verification_help_use_phrase, {
      keylessBackupFlow,
      origin,
    })
    navigate(Screens.AccountKeyEducation)
  }

  // for restore (which is always in onboarding) and setup from settings
  let body = t('phoneVerificationInput.helpDialog.body')
  let primaryCta = t('phoneVerificationInput.helpDialog.dismiss')
  let secondaryCta = t('phoneVerificationInput.helpDialog.skip')
  let onPressPrimaryCta = onGoBack
  let onPressSecondaryCta = onSkip

  // for setup from onboarding
  if (origin === KeylessBackupOrigin.Onboarding && keylessBackupFlow === KeylessBackupFlow.Setup) {
    body = t('phoneVerificationInput.helpDialog.bodyCloudBackupOnboarding')
    primaryCta = t('phoneVerificationInput.helpDialog.useRecoveryPhrase')
    secondaryCta = t('phoneVerificationInput.helpDialog.dismiss')
    onPressPrimaryCta = onUseRecoveryPhrase
    onPressSecondaryCta = onGoBack
  }

  return (
    <BottomSheet
      forwardedRef={bottomSheetRef}
      title={t('phoneVerificationInput.helpDialog.title')}
      titleStyle={styles.bottomSheetTitle}
      testId="KeylessBackupPhoneCodeInput/HelpInfoBottomSheet"
    >
      <View style={styles.bottomSheetView}>
        <Text style={styles.bottomSheetBody}>{body}</Text>
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <TextButton
              onPress={onPressSecondaryCta}
              testID="KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/SecondaryCta"
              style={styles.secondaryCta}
            >
              {secondaryCta}
            </TextButton>
          </View>
          <View style={styles.button}>
            <TextButton
              onPress={onPressPrimaryCta}
              testID="KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/PrimaryCta"
              style={styles.primaryCta}
            >
              {primaryCta}
            </TextButton>
          </View>
        </View>
      </View>
    </BottomSheet>
  )
}

function KeylessBackupPhoneCodeInput({
  route,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupPhoneCodeInput>) {
  const { t } = useTranslation()
  const { e164Number, keylessBackupFlow, origin } = route.params
  const { setSmsCode, verificationStatus } = useVerifyPhoneNumber(
    e164Number,
    keylessBackupFlow,
    origin
  )
  const onboardingProps = useSelector(onboardingPropsSelector)
  const { step, totalSteps } = getOnboardingStepValues(Screens.SignInWithEmail, onboardingProps)

  const bottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const onPressHelp = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_phone_verification_help, {
      keylessBackupFlow,
      origin,
    })
    bottomSheetRef.current?.snapToIndex(0)
  }

  const isSetupInOnboarding =
    keylessBackupFlow === KeylessBackupFlow.Setup && origin === KeylessBackupOrigin.Onboarding

  const headerLeft = isSetupInOnboarding ? (
    <BackButton
      testID="BackButton"
      eventName={KeylessBackupEvents.cab_enter_phone_code_back}
      eventProperties={{
        keylessBackupFlow,
        origin,
      }}
    />
  ) : (
    <KeylessBackupCancelButton
      flow={keylessBackupFlow}
      origin={origin}
      eventName={KeylessBackupEvents.cab_enter_phone_code_cancel}
    />
  )

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        style={styles.header}
        left={headerLeft}
        right={
          <TopBarTextButton
            title={t('phoneVerificationInput.help')}
            testID="KeylessBackupPhoneCodeInputHelp"
            onPress={onPressHelp}
            titleStyle={styles.help}
          />
        }
        title={
          isSetupInOnboarding && (
            <HeaderTitleWithSubtitle
              title={t('phoneVerificationInput.title')}
              subTitle={t('registrationSteps', { step, totalSteps })}
            />
          )
        }
      />
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
        title={
          !isSetupInOnboarding ? (
            <Text style={[styles.title, styles.titleOnSettings]}>
              {t('phoneVerificationInput.title')}
            </Text>
          ) : undefined
        }
      />
      <HelpInfoBottomSheet
        bottomSheetRef={bottomSheetRef}
        keylessBackupFlow={keylessBackupFlow}
        origin={origin}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
    color: colors.black,
  },
  titleOnSettings: {
    marginBottom: Spacing.Regular16,
  },
  help: {
    color: colors.accent,
    ...typeScale.labelSemiBoldMedium,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    textAlign: 'center',
  },
  bottomSheetView: {
    display: 'flex',
    flexDirection: 'column',
  },
  bottomSheetBody: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    paddingHorizontal: Spacing.Thick24,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 37,
    marginBottom: 9,
    marginHorizontal: Spacing.Smallest8,
  },
  primaryCta: {
    color: colors.accent,
    textAlign: 'center',
  },
  secondaryCta: {
    color: colors.gray4,
    textAlign: 'center',
  },
  button: {
    flex: 1,
    justifyContent: 'center',
  },
})

export default KeylessBackupPhoneCodeInput
