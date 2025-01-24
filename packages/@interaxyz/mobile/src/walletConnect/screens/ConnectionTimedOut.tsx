import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import Button, { BtnTypes } from 'src/components/Button'
import { navigateBack } from 'src/navigator/NavigationService'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

function ConnectionTimedOut() {
  const { t } = useTranslation()
  return (
    <>
      <Text style={styles.title}>{t('timeoutTitle')}</Text>
      <Text style={styles.subtitle}>{t('timeoutSubtitle')}</Text>
      <Button onPress={navigateBack} text={t('goBackButton')} type={BtnTypes.SECONDARY} />
    </>
  )
}

const styles = StyleSheet.create({
  title: {
    ...typeScale.titleMedium,
    textAlign: 'center',
  },
  subtitle: {
    ...typeScale.bodyMedium,
    color: colors.gray4,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
})

export default ConnectionTimedOut
