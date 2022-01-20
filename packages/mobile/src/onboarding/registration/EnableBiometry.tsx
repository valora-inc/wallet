import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Keychain from 'react-native-keychain'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { choseToRestoreAccountSelector } from 'src/account/selectors'
import { registrationStepsSelector, supportedBiometryTypeSelector } from 'src/app/selectors'
import {
  default as Face,
  default as FaceID,
  default as Fingerprint,
  default as TouchID,
} from 'src/icons/biometrics/FaceID'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { setPincodeWithBiometrics } from 'src/pincode/authentication'
import { default as useSelector } from 'src/redux/useSelector'
import Logger from 'src/utils/Logger'

const TAG = 'EnableBiometry'

type Props = StackScreenProps<StackParamList, Screens.EnableBiometry>

const biometryImageMap: { [key in Keychain.BIOMETRY_TYPE]: JSX.Element } = {
  [Keychain.BIOMETRY_TYPE.FACE_ID]: <FaceID />,
  [Keychain.BIOMETRY_TYPE.TOUCH_ID]: <TouchID />,
  [Keychain.BIOMETRY_TYPE.FINGERPRINT]: <Fingerprint />,
  [Keychain.BIOMETRY_TYPE.FACE]: <Face />,
  [Keychain.BIOMETRY_TYPE.IRIS]: <Face />,
}

const biometryButtonLabelMap: { [key in Keychain.BIOMETRY_TYPE]: string } = {
  [Keychain.BIOMETRY_TYPE.FACE_ID]: 'enableBiometry.cta.useFaceId',
  [Keychain.BIOMETRY_TYPE.TOUCH_ID]: 'enableBiometry.cta.useTouchId',
  [Keychain.BIOMETRY_TYPE.FINGERPRINT]: 'enableBiometry.cta.useFingerprint',
  [Keychain.BIOMETRY_TYPE.FACE]: 'enableBiometry.cta.useFace',
  [Keychain.BIOMETRY_TYPE.IRIS]: 'enableBiometry.cta.useIris',
}

export default function EnableBiometry({ navigation, route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // This screen would not be displayed if supportedBiometryType were null
  const supportedBiometryType = useSelector(supportedBiometryTypeSelector)
  const choseToRestoreAccount = useSelector(choseToRestoreAccountSelector)
  const { step, totalSteps } = useSelector(registrationStepsSelector)

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
          onPress={navigateHome}
          titleStyle={{ color: colors.goldDark }}
        />
      ),
    })
  }, [navigation, step, totalSteps])

  const onPressUseBiometry = async () => {
    try {
      await setPincodeWithBiometrics()
      dispatch(setPincodeSuccess(PincodeType.PhoneAuth))
      navigate(choseToRestoreAccount ? Screens.ImportWallet : Screens.VerificationEducationScreen)
    } catch (error) {
      Logger.warn(TAG, 'Error enabling biometrics', error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.imageContainer}>{biometryImageMap[supportedBiometryType!]}</View>
        <Text style={styles.description}>{t('enableBiometry.description')}</Text>
        <Button
          onPress={onPressUseBiometry}
          text={t(biometryButtonLabelMap[supportedBiometryType!])}
          size={BtnSizes.MEDIUM}
          type={BtnTypes.ONBOARDING}
          testID="EnableBiometryButton"
        />
      </ScrollView>
    </SafeAreaView>
  )
}

EnableBiometry.navigationOptions = nuxNavigationOptions

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  contentContainer: {
    paddingTop: 186,
    paddingHorizontal: 40,
    alignItems: 'center',
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
