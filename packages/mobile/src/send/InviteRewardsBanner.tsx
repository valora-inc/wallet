import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import Invite from 'src/icons/Invite'

export function InviteRewardsBanner() {
  const { t } = useTranslation(Namespaces.inviteFlow11)

  return (
    <View style={styles.container} testID="InviteRewardsBanner">
      <Invite />
      <View style={styles.textContainer}>
        <Text style={fontStyles.small500}>{t('inviteRewardsBanner.title')}</Text>
        <Text style={styles.bodyText}>{t('inviteRewardsBanner.body')}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    backgroundColor: colors.greenBackground,
  },
  textContainer: {
    flex: 1,
    paddingLeft: 20,
  },
  bodyText: {
    ...fontStyles.small,
  },
})
