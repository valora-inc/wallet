import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Keychain from 'react-native-keychain'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { initializeAccount, setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { choseToRestoreAccountSelector } from 'src/account/selectors'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  registrationStepsSelector,
  skipVerificationSelector,
  supportedBiometryTypeSelector,
} from 'src/app/selectors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Face from 'src/icons/biometry/Face'
import FaceID from 'src/icons/biometry/FaceID'
import Fingerprint from 'src/icons/biometry/Fingerprint'
import { Iris } from 'src/icons/biometry/Iris'
import TouchID from 'src/icons/biometry/TouchID'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsOnboarding } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { setPincodeWithBiometry } from 'src/pincode/authentication'
import { default as useSelector } from 'src/redux/useSelector'
import { isUserCancelledError } from 'src/storage/keychain'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'

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
  const choseToRestoreAccount = useSelector(choseToRestoreAccountSelector)
  const skipVerification = useSelector(skipVerificationSelector)
  const { step, totalSteps } = useSelector(registrationStepsSelector)

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
    if (choseToRestoreAccount) {
      navigate(Screens.ImportWallet)
      return
    }
    if (skipVerification) {
      dispatch(initializeAccount())
      dispatch(setHasSeenVerificationNux(true))
      navigateHome()
      return
    }
    navigate(Screens.VerificationStartScreen)
  }

  const onPressUseBiometry = async () => {
    try {
      ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_approve)
      await setPincodeWithBiometry()
      dispatch(setPincodeSuccess(PincodeType.PhoneAuth))
      ValoraAnalytics.track(OnboardingEvents.biometry_opt_in_complete)
      handleNavigateToNextScreen()
    } catch (error) {
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
          type={BtnTypes.ONBOARDING}
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
