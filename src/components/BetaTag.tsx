import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function BetaTag() {
  const { t } = useTranslation()
  return (
    <View testID="BetaTag" style={styles.container}>
      <Text style={styles.text}>{t('multichainBeta.beta')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.infoLight,
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    color: Colors.infoDark,
    ...typeScale.labelSemiBoldSmall,
  },
})
