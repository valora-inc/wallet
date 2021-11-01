import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
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
import { WalletConnectSession } from 'src/walletConnect/types'
import { closeSession as closeSessionActionV1 } from 'src/walletConnect/v1/actions'
import { selectSessions as selectSessionsV1 } from 'src/walletConnect/v1/selectors'
import { closeSession as closeSessionActionV2 } from 'src/walletConnect/v2/actions'
import { selectSessions as selectSessionsV2 } from 'src/walletConnect/v2/selectors'
import { AppMetadata, SessionTypes } from 'walletconnect-v2/types'

type Session = WalletConnectSession | SessionTypes.Created

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
  const { sessions: sessionsV1 } = useSelector(selectSessionsV1)
  const { sessions: sessionsV2 } = useSelector(selectSessionsV2)
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
      'topic' in highlighted ? closeSessionActionV2(highlighted) : closeSessionActionV1(highlighted)
    )
    closeModal()
  }

  const dappName =
    highlighted && 'topic' in highlighted
      ? highlighted?.peer.metadata.name
      : highlighted?.peerMeta?.name
  return (
    <ScrollView testID="WalletConnectSessionsView">
      <Dialog
        title={t('disconnectTitle', {
          dappName,
        })}
        actionPress={closeSession}
        actionText={t('disconnect')}
        secondaryActionText={t('cancel')}
        secondaryActionPress={closeModal}
        isVisible={!!highlighted}
      >
        {t('disconnectBody', { dappName })}
      </Dialog>

      <View style={styles.container}>
        <Text style={styles.title}>{t('sessionsTitle')}</Text>
        <Text style={styles.subTitle}>{t('sessionsSubTitle')}</Text>
      </View>

      <View style={[styles.container, styles.appsContainer]}>
        {sessionsV1.map((s) => (
          <App key={s.peerId} metadata={s.peerMeta} onPress={openModal(s)} />
        ))}
        {sessionsV2.map((s) => (
          <App key={s.topic} metadata={s.peer.metadata} onPress={openModal(s)} />
        ))}
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
