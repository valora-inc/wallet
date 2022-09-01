import { StackScreenProps } from '@react-navigation/stack'
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
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
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

type Props = StackScreenProps<StackParamList, Screens.EnableBiometry>

const biometryImageMap: { [key in Keychain.BIOMETRY_TYPE]: JSX.Element } = {
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
          title={t('enableBiometry.title')}
          subTitle={t('registrationSteps', { step, totalSteps })}
        />
      ),
      headerRight: () => (
        <TopBarTextButton
          title={t('skip')}
          testID="EnableBiometrySkipHeader"
          onPress={onPressSkip}
          titleStyle={{ color: colors.goldDark }}
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
    navigate(Screens.VerificationEducationScreen)
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
        <View style={styles.imageContainer}>{biometryImageMap[supportedBiometryType!]}</View>
        <Text style={styles.description}>
          {t('enableBiometry.description', {
            biometryType: t(`biometryType.${supportedBiometryType}`),
          })}
        </Text>
        <Button
          onPress={onPressUseBiometry}
          text={t('enableBiometry.cta', {
            biometryType: t(`biometryType.${supportedBiometryType}`),
          })}
          size={BtnSizes.MEDIUM}
          type={BtnTypes.ONBOARDING}
          testID="EnableBiometryButton"
        />
      </SafeAreaView>
    </ScrollView>
  )
}

EnableBiometry.navigationOptions = nuxNavigationOptions

const styles = StyleSheet.create({
  container: {
    paddingTop: 186,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  imageContainer: {
    marginBottom: Spacing.Thick24,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginBottom: Spacing.Thick24,
  },
})
