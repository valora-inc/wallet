import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { AppMetadata } from '@walletconnect/types-v2'
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
import { closeSession as closeSessionActionV1 } from 'src/walletConnect/actions-v1'
import { closeSession as closeSessionActionV2 } from 'src/walletConnect/actions-v2'
import { Session } from 'src/walletConnect/reducer'
import { selectSessions } from 'src/walletConnect/selectors'

const App = ({ metadata, onPress }: { metadata: AppMetadata | null; onPress: () => void }) => {
  const icon = metadata?.icons[0] || `${metadata?.url}/favicon.ico`
  const { t } = useTranslation(Namespaces.walletConnect)

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.row}>
        <Image source={{ uri: icon }} style={styles.icon} />
        <View style={styles.rowContent}>
          <Text style={styles.appName}>{metadata?.name}</Text>
          <Text style={styles.disconnectButton}>{t('tapToDisconnect')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function Sessions() {
  const { t } = useTranslation(Namespaces.walletConnect)
  const { sessions } = useSelector(selectSessions)
  const [highlighted, setHighlighted] = useState<Session | null>(null)
  const dispatch = useDispatch()

  const closeModal = () => {
    setHighlighted(null)
  }

  const openModal = (session: Session) => () => {
    setHighlighted(session)
  }

  const closeSession = () => {
    if (!highlighted) {
      return
    }

    dispatch(
      highlighted.isV1
        ? closeSessionActionV1(highlighted.session)
        : closeSessionActionV2(highlighted.session)
    )
    closeModal()
  }

  const appName = highlighted?.isV1
    ? highlighted?.session.peerMeta?.name
    : highlighted?.session.peer.metadata.name
  return (
    <ScrollView testID="WalletConnectSessionsView">
      <Dialog
        title={t('disconnectTitle', {
          appName,
        })}
        actionPress={closeSession}
        actionText={t('disconnect')}
        secondaryActionText={t('cancel')}
        secondaryActionPress={closeModal}
        isVisible={!!highlighted}
      >
        {t('disconnectBody', { appName })}
      </Dialog>

      <View style={styles.container}>
        <Text style={styles.title}>{t('sessionsTitle')}</Text>
        <Text style={styles.subTitle}>{t('sessionsSubTitle')}</Text>
      </View>

      <View style={[styles.container, styles.appsContainer]}>
        {sessions.map((s) => {
          if (s.isV1) {
            return (
              <App key={s.session.peerId} metadata={s.session.peerMeta} onPress={openModal(s)} />
            )
          }
          return (
            <App key={s.session.topic} metadata={s.session.peer.metadata} onPress={openModal(s)} />
          )
        })}
      </View>
    </ScrollView>
  )
}

function HeaderRight() {
  const onPress = () =>
    navigate(Screens.QRNavigator, {
      screen: Screens.QRScanner,
    })

  return <TopBarTextButton title={i18n.t('global:scan')} testID="ScanButton" onPress={onPress} />
}

Sessions.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerRight: HeaderRight,
  }
}

const styles = StyleSheet.create({
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
  appsContainer: {
    paddingVertical: 24,
  },

  // connected apps
  row: { display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: 24 },
  icon: { height: 40, width: 40 },
  rowContent: {
    paddingLeft: 12,
  },
  appName: {
    ...fontStyles.regular,
    color: colors.dark,
  },
  disconnectButton: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})

export default Sessions
