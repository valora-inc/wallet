import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { background } from 'src/images/Images'
import Logo from 'src/images/Logo'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function OnboardingSuccessScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigateHome()
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Image source={background} style={styles.backgroundImage} />
      <Logo color={colors.contentOnboardingComplete} size={70} />
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
    ...typeScale.titleSmall,
    fontSize: 30,
    lineHeight: 36,
    color: colors.contentOnboardingComplete,
    marginTop: Spacing.Regular16,
    marginBottom: 30,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    shadowColor: colors.softShadow,
  },
})

export default OnboardingSuccessScreen
