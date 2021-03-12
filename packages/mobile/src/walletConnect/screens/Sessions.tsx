import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, StyleSheet, Text, View } from 'react-native'
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { Namespaces } from 'src/i18n'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getSessions } from 'src/walletConnect/selectors'

export default function WalletConnectSessionsScreen() {
  const sessions = useSelector(getSessions)
  const { t } = useTranslation(Namespaces.walletConnect)
  // const sessions = useSelector()

  console.log(sessions)

  return (
    <SafeAreaView style={styles.screen}>
      <DrawerTopBar />
      <ScrollView testID="SettingsScrollView">
        <View style={styles.container}>
          <Text style={styles.title}>{t('sessionsTitle')}</Text>
          <Text style={styles.subTitle}>{t('sessionsSubTitle')}</Text>
        </View>

        <ItemSeparator />

        <View style={[styles.container, { paddingVertical: 16 }]}>
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <TouchableOpacity
                onPress={() =>
                  navigate(Screens.QRNavigator, {
                    screen: Screens.QRScanner,
                  })
                }
              >
                <Text style={{ color: colors.dark }}>{t('noConnectedApps')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {sessions.map((s) => (
                <View>
                  <Text>{s.peer.metadata.name}</Text>

                  <Button title="Kill" onPress={() => {}}></Button>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: variables.contentPadding,
  },
  title: {
    ...fontStyles.h1,
    // marginHorizontal: 16,
    marginTop: 16,
  },
  subTitle: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingVertical: 16,
    // paddingRight: 16,
    // marginHorizontal: 16,
  },
  share: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  sectionDivider: {
    alignItems: 'center',
    width: 200,
  },
  sectionHeaderText: {
    ...fontStyles.label,
    marginTop: 16,
    marginBottom: 4,
  },
  button: {
    marginTop: 24,
  },
  cancelButton: {
    color: colors.dark,
  },
  details: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 16,
    paddingRight: 16,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: 12,
  },
})
