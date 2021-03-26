import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { AppMetadata, SessionTypes } from '@walletconnect/types'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { closeSession as closeSessionAction } from 'src/walletConnect/actions'
import { selectPendingActions, selectSessions } from 'src/walletConnect/selectors'

const Row = ({
  metadata,
  text,
  onPress,
}: {
  metadata: AppMetadata
  text: string
  onPress: () => void
}) => {
  const icon = metadata.icons[0] || `${metadata.url}/favicon.ico`
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: 24 }}
      >
        <Image source={{ uri: icon }} height={30} width={30} style={{ height: 30, width: 30 }} />
        <Text
          style={{
            ...fontStyles.large,
            color: colors.dark,
            paddingLeft: 16,
          }}
        >
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const Sessions = () => {
  const { sessions, pending: pendingSessions } = useSelector(selectSessions)
  const { t } = useTranslation(Namespaces.walletConnect)
  const [highlighted, setHighlighted] = useState<SessionTypes.Settled | null>(null)
  const dispatch = useDispatch()

  const closeSession = () => {
    if (!highlighted) {
      return
    }

    dispatch(closeSessionAction(highlighted))
    setHighlighted(null)
  }

  return (
    <View style={[styles.container, { paddingVertical: 24 }]}>
      <Dialog
        title={t('disconnectTitle', { appName: highlighted?.peer.metadata.name })}
        actionPress={closeSession}
        actionText={t('disconnect')}
        secondaryActionText={t('cancel')}
        secondaryActionPress={() => setHighlighted(null)}
        isVisible={!!highlighted}
      >
        {t('disconnectBody', { appName: highlighted?.peer.metadata.name })}
      </Dialog>

      {[...sessions, ...pendingSessions].length === 0 ? (
        <View style={styles.emptyState}>
          <TouchableOpacity
            onPress={() =>
              navigate(Screens.QRNavigator, {
                screen: Screens.QRScanner,
              })
            }
          >
            <Text
              style={{
                ...fontStyles.small,
                color: colors.dark,
              }}
            >
              {t('noConnectedApps')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ display: 'flex' }}>
          {pendingSessions.map((s) => (
            <Row
              metadata={s.proposer.metadata}
              onPress={() => navigate(Screens.WalletConnectSessionRequest, { session: s })}
              text={t('pending', { appName: s.proposer.metadata.name })}
            />
          ))}

          {sessions.map((s) => {
            return (
              <Row
                metadata={s.peer.metadata}
                onPress={() => setHighlighted(s)}
                text={s.peer.metadata.name}
              />
            )
          })}

          <TouchableOpacity
            onPress={() =>
              navigate(Screens.QRNavigator, {
                screen: Screens.QRScanner,
              })
            }
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                ...fontStyles.small,
                color: colors.dark,
              }}
            >
              {t('connectAnotherApp')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const Requests = () => {
  const requests = useSelector(selectPendingActions)
  const { sessions } = useSelector(selectSessions)
  const { t } = useTranslation(Namespaces.walletConnect)

  return (
    <View style={[styles.container, { paddingVertical: 24 }]}>
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

            return (
              <Row
                metadata={session.peer.metadata}
                onPress={() => navigate(Screens.WalletConnectActionRequest, { request: r })}
                text={r.request.method}
              />
            )
          })}
        </View>
      )}
    </View>
  )
}

export default function WalletConnectSessionsScreen() {
  const { t } = useTranslation(Namespaces.walletConnect)
  const layout = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: 'sessions', title: 'Sessions' },
    { key: 'requests', title: 'Requests' },
  ])

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
          renderTabBar={(props) => (
            <TabBar
              {...props}
              activeColor={'green'}
              labelStyle={{
                color: colors.dark,
              }}
              indicatorStyle={{
                backgroundColor: colors.goldBrand,
              }}
              style={{ backgroundColor: undefined }}
            />
          )}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width - variables.contentPadding }}
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
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: 12,
  },
})
