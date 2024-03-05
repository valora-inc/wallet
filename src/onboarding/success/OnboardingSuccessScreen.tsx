import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { background } from 'src/images/Images'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { goToNextOnboardingScreen, onboardingPropsSelector } from 'src/onboarding/steps'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function OnboardingSuccessScreen() {
  const onboardingProps = useSelector(onboardingPropsSelector)
  useEffect(() => {
    const timeout = setTimeout(
      () =>
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.VerificationStartScreen,
          onboardingProps,
        }),
      3000
    )

    return () => clearTimeout(timeout)
  }, [])

  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Image source={background} style={styles.backgroundImage} />
      <Logo type={LogoTypes.LIGHT} height={70} />
      <Text style={styles.text}>{t('success.message')}</Text>
    </View>
  )
}

OnboardingSuccessScreen.navigationOptions = nuxNavigationOptionsNoBackButton

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'stretch',
    width: undefined,
    height: undefined,
  },
  text: {
    ...fontStyles.h2,
    fontSize: 30,
    lineHeight: 36,
    color: colors.white,
    marginTop: Spacing.Regular16,
    marginBottom: 30,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    shadowColor: 'rgba(46, 51, 56, 0.15)',
  },
})

export default OnboardingSuccessScreen
