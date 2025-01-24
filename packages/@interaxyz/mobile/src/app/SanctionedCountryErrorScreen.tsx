import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { emptyHeader } from 'src/navigator/Headers'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export function SanctionedCountryErrorScreen() {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Text style={styles.errorMessage}>{t('unsupportedLocation')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: Spacing.Regular16,
  },
  errorMessage: {
    ...typeScale.bodyMedium,
  },
})

SanctionedCountryErrorScreen.navigationOptions = {
  ...emptyHeader,
  // Prevent swiping back on iOS
  gestureEnabled: false,
  headerLeft: () => null,
}

export default SanctionedCountryErrorScreen
