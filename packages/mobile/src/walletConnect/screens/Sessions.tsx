import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { SessionTypes } from '@walletconnect/types'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SceneMap, TabView } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { closeSession as closeSessionAction } from 'src/walletConnect/actions'
import { getPendingRequests, getSessions } from 'src/walletConnect/selectors'

const Sessions = () => {
  const sessions = useSelector(getSessions)
  const { t } = useTranslation(Namespaces.walletConnect)
  const [highlighted, setHighlighted] = useState<SessionTypes.Settled | null>(null)
  const dispatch = useDispatch()

  const closeSession = useCallback(() => {
    if (!highlighted) {
      return
    }

    dispatch(closeSessionAction(highlighted))
    setHighlighted(null)
  }, [highlighted, dispatch])

  return (
    <View style={[styles.container, { paddingVertical: 16 }]}>
      <Dialog
        title={`Disconnect ${highlighted?.peer.metadata.name}`}
        actionPress={closeSession}
        actionText="Disconnect"
        secondaryActionText="Cancel"
        secondaryActionPress={() => setHighlighted(null)}
        isVisible={!!highlighted}
      >
        Are you sure you want to disconnect from {highlighted?.peer.metadata.name}? You'll need to
        reconnect before performing any further actions.
      </Dialog>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <TouchableOpacity
            onPress={() =>
              navigate(Screens.QRNavigator, {
                screen: Screens.QRScanner,
              })
            }
          >
            <Text>{t('noConnectedApps')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {sessions.map((s) => {
            const icon = s.peer.metadata.icons[0] || `${s.peer.metadata.url}/favicon.ico`
            return (
              <TouchableOpacity key={s.topic} onPress={() => setHighlighted(s)}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ uri: icon }}
                    height={40}
                    width={40}
                    style={{ height: 40, width: 40 }}
                  />
                  <Text
                    style={{
                      ...fontStyles.large,
                      color: colors.dark,
                      paddingLeft: 16,
                    }}
                  >
                    {s.peer.metadata.name}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

const Requests = () => {
  const requests = useSelector(getPendingRequests)
  const sessions = useSelector(getSessions)
  const { t } = useTranslation(Namespaces.walletConnect)

  return (
    <View style={[styles.container, { paddingVertical: 16 }]}>
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>{t('noPendingRequests')}</Text>
        </View>
      ) : (
        <View>
          {requests.map((r) => {
            const session = sessions.find((s) => s.topic === r.topic)
            if (!session) {
              return null
            }

            const title = `${r.request.method} from ${session?.peer.metadata.name}`
            const icon =
              session.peer.metadata.icons[0] || `${session.peer.metadata.url}/favicon.ico`

            return (
              <TouchableOpacity
                key={r.topic}
                onPress={() => navigate(Screens.WalletConnectActionRequest, { request: r })}
              >
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ uri: icon }}
                    height={40}
                    width={40}
                    style={{ height: 40, width: 40 }}
                  />
                  <Text
                    style={{
                      ...fontStyles.small,
                      color: colors.dark,
                      paddingLeft: 16,
                    }}
                  >
                    {title}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

export default function WalletConnectSessionsScreen() {
  const { t } = useTranslation(Namespaces.walletConnect)
  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: 'sessions', title: 'Sessions' },
    { key: 'requests', title: 'Requests' },
  ])

  const layout = useWindowDimensions()

  const renderScene = SceneMap({
    sessions: Sessions,
    requests: Requests,
  })

  return (
    <SafeAreaView style={styles.screen}>
      <DrawerTopBar />
      <ScrollView testID="SettingsScrollView">
        <View style={styles.container}>
          <Text style={styles.title}>{t('sessionsTitle')}</Text>
          <Text style={styles.subTitle}>{t('sessionsSubTitle')}</Text>
        </View>

        <ItemSeparator />

        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
        />
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
    marginTop: 16,
  },
  subTitle: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingVertical: 16,
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
