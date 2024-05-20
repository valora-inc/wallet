import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Keychain from 'react-native-keychain'
import { SafeAreaView } from 'react-native-safe-area-context'
import { setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { supportedBiometryTypeSelector } from 'src/app/selectors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Face from 'src/icons/biometry/Face'
import FaceID from 'src/icons/biometry/FaceID'
import Fingerprint from 'src/icons/biometry/Fingerprint'
import { Iris } from 'src/icons/biometry/Iris'
import TouchID from 'src/icons/biometry/TouchID'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsOnboarding } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import {
  getOnboardingStepValues,
  goToNextOnboardingScreen,
  onboardingPropsSelector,
} from 'src/onboarding/steps'
import { setPincodeWithBiometry } from 'src/pincode/authentication'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { isUserCancelledError } from 'src/storage/keychain'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
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
}

export default function EnableBiometry({ navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // This screen would not be displayed if supportedBiometryType were null
  const supportedBiometryType = useSelector(supportedBiometryTypeSelector)
  const onboardingProps = useSelector(onboardingPropsSelector)

  const { step, totalSteps } = getOnboardingStepValues(Screens.EnableBiometry, onboardingProps)

  useEffect(() => {
    ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_start)
  }, [])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          title={t(`biometryType.${supportedBiometryType}`)}
          subTitle={t('registrationSteps', { step, totalSteps })}
        />
      ),
      headerRight: () => (
        <TopBarTextButton
          title={t('skip')}
          testID="EnableBiometrySkipHeader"
          onPress={onPressSkip}
          titleStyle={{ color: colors.onboardingBrownLight }}
        />
      ),
    })
  }, [navigation, step, totalSteps])

  const onPressSkip = () => {
    ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_cancel)
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
      ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_approve)
      await setPincodeWithBiometry()
      dispatch(setPincodeSuccess(PincodeType.PhoneAuth))
      ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_complete)
      handleNavigateToNextScreen()
    } catch (err) {
      const error = ensureError(err)
      ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_error)
      if (!isUserCancelledError(error)) {
        Logger.error(TAG, 'Error enabling biometry', error)
      }
    }
  }

  return (
    <ScrollView style={styles.contentContainer}>
      <SafeAreaView style={styles.container}>
        {
          <>
            <Text style={styles.guideTitle}>
              {t('enableBiometry.guideTitle', {
                biometryType: t(`biometryType.${supportedBiometryType}`),
              })}
            </Text>
            <Text style={styles.guideText}>
              {t('enableBiometry.guideDescription', {
                biometryType: t(`biometryType.${supportedBiometryType}`),
              })}
            </Text>
          </>
        }
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
          style={styles.biometryButton}
        />
      </SafeAreaView>
    </ScrollView>
  )
}

EnableBiometry.navigationOptions = nuxNavigationOptionsOnboarding

const styles = StyleSheet.create({
  container: {
    paddingTop: 72,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  biometryButton: {
    width: '100%',
  },
  guideTitle: {
    ...fontStyles.h1,
    marginBottom: Spacing.Regular16,
    textAlign: 'center',
  },
  guideText: {
    ...fontStyles.regular,
    marginBottom: Spacing.Large32,
    textAlign: 'center',
  },
  biometryIcon: {
    paddingRight: 4,
  },
})
