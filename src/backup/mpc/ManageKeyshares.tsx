import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { KeyshareType } from 'src/backup/mpc/hooks'
import Touchable from 'src/components/Touchable'
import i18n from 'src/i18n'
import { manageMigrate, manageMpc, manageRefresh } from 'src/images/Images'
import { emptyHeader } from 'src/navigator/Headers'
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
  const options = useAccountManagement()

  const renderManageAction = ({ item }: any) => {
    return (
      <Touchable style={styles.manageItem} key={item.title} onPress={item.action}>
        <>
          <Image source={item.image} style={styles.bodyImage} resizeMode="contain" />
          <Text style={styles.bodyText}>{t(item.title)}</Text>
        </>
      </Touchable>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.body}>{t('manageKeyshareInfo')}</Text>
      </View>
      <FlatList style={styles.grid} data={options} renderItem={renderManageAction} numColumns={2} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    paddingTop: Spacing.Thick24,
    paddingHorizontal: Spacing.Regular16,
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'justify',
    marginBottom: variables.contentPadding,
  },
  grid: {
    flexGrow: 1,
    paddingHorizontal: Spacing.Regular16,
    width: '100%',
  },
  manageItem: {
    minWidth: '50%',
    maxWidth: '50%',
    paddingBottom: Spacing.Thick24,
  },
  bodyImage: {
    maxWidth: '100%',
    flexGrow: 1,
  },
  bodyText: {
    ...fontStyles.label,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})

ManageKeyshares.navigationOptions = () => {
  return {
    ...emptyHeader,
    headerTitle: i18n.t('manageKeyshare'),
  }
}

const useAccountManagement = () => {
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

  const goToMultiParty = () => {
    navigate(Screens.MultiPartyEducationScreen)
  }

  const { t } = useTranslation()
  return useMemo(() => {
    return [
      { image: manageMigrate, action: goToUserKeyshare },
      { image: manageRefresh, action: goToRecoveryKeyshare },
      { image: manageMpc, action: goToMultiParty },
    ].map((item, i) => {
      return { ...item, title: t(`manageAccount.${i}`) }
    })
  }, [])
}

export default ManageKeyshares
