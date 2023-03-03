import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { KeyshareType } from 'src/backup/mpc/hooks'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

/**
 * Provide user introduction into multi-party computation, and
 * entry points into migrating their user keyshare or refreshing
 * their restore keyshare.
 */
const ManageKeyshares = () => {
  const { t } = useTranslation()

  const goToUserKeyshare = () => {
    // @note has seen education?
    navigate(Screens.KeyshareEducationScreen, { type: KeyshareType.User })
    // @todo nav to user keyshare education
  }

  const goToRecoveryKeyshare = () => {
    // @note has seen education?
    navigate(Screens.KeyshareEducationScreen, { type: KeyshareType.Recovery })
    // @todo nav to restore education
  }

  return (
    <SafeAreaView>
      <DrawerTopBar />
      <View style={styles.innerContainer}>
        <Text style={styles.h1}>{t('manageKeyshare')}</Text>
        <Text style={styles.body}>{t('manageKeyshareInfo')}</Text>
      </View>
      <SettingsItemTextValue
        testID="MigrateUserKeyshare"
        title={'Migrate User Keyshare'}
        onPress={goToUserKeyshare}
        showChevron
      />
      <SettingsItemTextValue
        testID="RefreshRecoveryKeyshare"
        title={'Refresh Recovery Keyshare'}
        onPress={goToRecoveryKeyshare}
        showChevron
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  innerContainer: {
    paddingTop: Spacing.Thick24,
    paddingHorizontal: Spacing.Regular16,
  },
  h1: {
    ...fontStyles.h1,
    textAlign: 'center',
    marginBottom: variables.contentPadding,
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'justify',
    marginBottom: variables.contentPadding,
  },
})

export default ManageKeyshares
