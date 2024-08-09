import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import * as AndroidOpenSettings from 'react-native-android-open-settings'
import TextButton from 'src/components/TextButton'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { navigateToURI } from 'src/utils/linking'

export default function NotAuthorizedView() {
  const { t } = useTranslation()
  const onPressSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      navigateToURI('app-settings:')
    } else if (Platform.OS === 'android') {
      AndroidOpenSettings.appDetailsSettings()
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('cameraNotAuthorizedTitle')}</Text>
      <Text style={styles.description}>{t('cameraNotAuthorizedDescription')}</Text>
      <TextButton onPress={onPressSettings}>{t('cameraSettings')}</TextButton>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    ...typeScale.titleSmall,
    marginBottom: 8,
    color: colors.white,
  },
  description: {
    ...typeScale.bodyMedium,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
})
