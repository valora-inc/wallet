import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button, { BtnTypes } from 'src/components/Button'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

export default function ShakeForSupport() {
  const { t } = useTranslation()

  const onContactSupport = () => {
    navigate(Screens.SupportContact)
  }

  return (
    <SafeAreaView style={styles.shakeForSupport}>
      <Text testID="HavingTrouble" style={styles.supportTitle}>
        {t('havingTrouble')}
      </Text>
      <Text testID="ShakeForSupport" style={styles.supportSubtitle}>
        {t('shakeForSupport')}
      </Text>
      <Button
        onPress={onContactSupport}
        text={t('contactSupport')}
        type={BtnTypes.PRIMARY}
        testID="ContactSupportFromShake"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  shakeForSupport: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.light,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  supportTitle: {
    ...fontStyles.h2,
    marginTop: 16,
  },
  supportSubtitle: {
    ...fontStyles.regular,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
})
