import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Keychain from 'react-native-keychain'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { supportedBiometryTypeSelector } from 'src/app/selectors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Face from 'src/icons/biometry/Face'
import FaceID from 'src/icons/biometry/FaceID'
import Fingerprint from 'src/icons/biometry/Fingerprint'
import { Iris } from 'src/icons/biometry/Iris'
import TouchID from 'src/icons/biometry/TouchID'
import {
  biometryFace,
  biometryFaceId,
  biometryFingerprint,
  biometryIris,
  biometryTouchId,
} from 'src/images/Images'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsOnboarding } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import {
  getOnboardingStepValues,
  goToNextOnboardingScreen,
  onboardingPropsSelector,
} from 'src/onboarding/steps'
import { setPincodeWithBiometry } from 'src/pincode/authentication'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { isUserCancelledError } from 'src/storage/keychain'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'

const TAG = 'EnableBiometry'

type Props = NativeStackScreenProps<StackParamList, Screens.EnableBiometry>

const biometryIconMap: { [key in Keychain.BIOMETRY_TYPE]: JSX.Element } = {
  [Keychain.BIOMETRY_TYPE.FACE_ID]: <FaceID />,
  [Keychain.BIOMETRY_TYPE.TOUCH_ID]: <TouchID />,
  [Keychain.BIOMETRY_TYPE.FINGERPRINT]: <Fingerprint />,
  [Keychain.BIOMETRY_TYPE.FACE]: <Face />,
  [Keychain.BIOMETRY_TYPE.IRIS]: <Iris />,
  [Keychain.BIOMETRY_TYPE.OPTIC_ID]: <Iris />,
}

const biometryImageMap: { [key in Keychain.BIOMETRY_TYPE]: JSX.Element } = {
  [Keychain.BIOMETRY_TYPE.FACE_ID]: <Image testID="Image/FaceID" source={biometryFaceId} />,
  [Keychain.BIOMETRY_TYPE.TOUCH_ID]: <Image testID="Image/TouchID" source={biometryTouchId} />,
  [Keychain.BIOMETRY_TYPE.FINGERPRINT]: (
    <Image testID="Image/Fingerprint" source={biometryFingerprint} />
  ),
  [Keychain.BIOMETRY_TYPE.FACE]: <Image testID="Image/Face" source={biometryFace} />,
  [Keychain.BIOMETRY_TYPE.IRIS]: <Image testID="Image/Iris" source={biometryIris} />,
  [Keychain.BIOMETRY_TYPE.OPTIC_ID]: <Image testID="Image/Iris" source={biometryIris} />,
}

export default function EnableBiometry({ navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()
  const { bottom } = useSafeAreaInsets()
  const insetsStyle = {
    marginBottom: Math.max(bottom, 40),
  }

  // This screen would not be displayed if supportedBiometryType were null
  const supportedBiometryType = useSelector(supportedBiometryTypeSelector)
  const onboardingProps = useSelector(onboardingPropsSelector)

  const { step, totalSteps } = getOnboardingStepValues(Screens.EnableBiometry, onboardingProps)

  useEffect(() => {
    AppAnalytics.track(OnboardingEvents.biometry_opt_in_start)
  }, [])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          title={t(`biometryType.${supportedBiometryType}`)}
          subTitle={t('registrationSteps', { step, totalSteps })}
        />
      ),
    })
  }, [navigation, step, totalSteps])

  const onPressSkip = () => {
    AppAnalytics.track(OnboardingEvents.biometry_opt_in_cancel)
    handleNavigateToNextScreen()
  }

  const handleNavigateToNextScreen = () => {
    goToNextOnboardingScreen({
      firstScreenInCurrentStep: Screens.EnableBiometry,
      onboardingProps,
    })
  }

  const onPressUseBiometry = async () => {
    try {
      AppAnalytics.track(OnboardingEvents.biometry_opt_in_approve)
      await setPincodeWithBiometry()
      dispatch(setPincodeSuccess(PincodeType.PhoneAuth))
      AppAnalytics.track(OnboardingEvents.biometry_opt_in_complete)
      handleNavigateToNextScreen()
    } catch (err) {
      const error = ensureError(err)
      AppAnalytics.track(OnboardingEvents.biometry_opt_in_error)
      if (!isUserCancelledError(error)) {
        Logger.error(TAG, 'Error enabling biometry', error)
      }
    }
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: headerHeight }]} edges={['top']}>
      <ScrollView>
        <>
          {supportedBiometryType && (
            <View style={{ alignItems: 'center', margin: Spacing.Thick24 }}>
              {biometryImageMap[supportedBiometryType]}
            </View>
          )}
          <View style={styles.descriptionContainer}>
            <Text style={styles.guideTitle}>{t('enableBiometry.title')}</Text>
            <Text style={styles.guideText}>
              {t('enableBiometry.guideDescription', {
                biometryType: t(`biometryType.${supportedBiometryType}`),
              })}
            </Text>
          </View>
        </>
      </ScrollView>
      <View style={[styles.buttonContainer, insetsStyle]}>
        <Button
          onPress={onPressUseBiometry}
          text={t('enableBiometry.cta', {
            biometryType: t(`biometryType.${supportedBiometryType}`),
          })}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          testID="EnableBiometryButton"
          icon={
            supportedBiometryType && (
              <View style={styles.biometryIcon}>{biometryIconMap[supportedBiometryType]}</View>
            )
          }
        />
        <Button
          onPress={onPressSkip}
          text={t('skip')}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          testID="EnableBiometrySkip"
        />
      </View>
    </SafeAreaView>
  )
}

EnableBiometry.navigationOptions = nuxNavigationOptionsOnboarding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.Thick24,
  },
  descriptionContainer: {
    gap: Spacing.Regular16,
  },
  guideTitle: {
    ...typeScale.titleMedium,
    textAlign: 'center',
  },
  guideText: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
  },
  biometryIcon: {
    paddingRight: 4,
  },
  buttonContainer: {
    gap: Spacing.Smallest8,
  },
})
