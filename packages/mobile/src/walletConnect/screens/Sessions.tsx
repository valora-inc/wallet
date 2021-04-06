import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { AppMetadata, SessionTypes } from '@walletconnect/types'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import Dialog from 'src/components/Dialog'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { closeSession as closeSessionAction } from 'src/walletConnect/actions'
import { selectSessions } from 'src/walletConnect/selectors'

const App = ({ metadata, onPress }: { metadata: AppMetadata; onPress: () => void }) => {
  const icon = metadata.icons[0] || `${metadata.url}/favicon.ico`
  const { t } = useTranslation(Namespaces.walletConnect)

  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: 24 }}
      >
        <Image source={{ uri: icon }} height={30} width={30} style={{ height: 30, width: 30 }} />
        <View>
          <Text
            style={{
              ...fontStyles.large,
              color: colors.dark,
              paddingLeft: 16,
            }}
          >
            {metadata.name}
          </Text>
          <Text>{t('tapToDisconnect')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function WalletConnectSessionsScreen() {
  const { t } = useTranslation(Namespaces.walletConnect)
  const { sessions, pending: pendingSessions } = useSelector(selectSessions)
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
    <ScrollView testID="WalletConnectSessionsView">
      <View style={styles.container}>
        <Text style={styles.title}>{t('sessionsTitle')}</Text>
        <Text style={styles.subTitle}>{t('sessionsSubTitle')}</Text>
      </View>

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

        <View style={{ display: 'flex' }}>
          {sessions.map((s) => {
            return <App metadata={s.peer.metadata} onPress={() => setHighlighted(s)} />
          })}
        </View>
      </View>
    </ScrollView>
  )
}

WalletConnectSessionsScreen.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerRight: () => (
      <TopBarTextButton
        title={i18n.t('global:scan')}
        testID="ScanButton"
        onPress={() =>
          navigate(Screens.QRNavigator, {
            screen: Screens.QRScanner,
          })
        }
      />
    ),
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: variables.contentPadding,
  },
  title: {
    ...fontStyles.h2,
    marginTop: 16,
  },
  subTitle: {
    ...fontStyles.regular,
    color: colors.dark,
    paddingVertical: 16,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: 12,
  },
})

export default WalletConnectSessionsScreen
