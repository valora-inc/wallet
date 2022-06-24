import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function OnboardingSuccessScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => navigateHome(), 3000)

    return () => clearTimeout(timeout)
  }, [])

  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Logo type={LogoTypes.LIGHT} height={70} />
      <Text style={styles.text}>{t('success.message')}</Text>
    </View>
  )
}

OnboardingSuccessScreen.navigationOptions = nuxNavigationOptionsNoBackButton

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.greenBrand,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...fontStyles.h2,
    fontSize: 30,
    lineHeight: 36,
    color: colors.light,
    marginTop: Spacing.Regular16,
    marginBottom: 30,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    shadowColor: 'rgba(46, 51, 56, 0.15)',
  },
})

export default OnboardingSuccessScreen
