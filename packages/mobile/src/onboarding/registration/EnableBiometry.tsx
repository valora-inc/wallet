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
import Face from 'src/icons/biometry/Face'
import FaceID from 'src/icons/biometry/FaceID'
import Fingerprint from 'src/icons/biometry/Fingerprint'
import TouchID from 'src/icons/biometry/TouchID'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { setPincodeWithBiometry } from 'src/pincode/authentication'
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

export default function EnableBiometry({ navigation }: Props) {
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
      await setPincodeWithBiometry()
      dispatch(setPincodeSuccess(PincodeType.PhoneAuth))
      navigate(choseToRestoreAccount ? Screens.ImportWallet : Screens.VerificationEducationScreen)
    } catch (error) {
      Logger.error(TAG, 'Error enabling biometry', error)
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
