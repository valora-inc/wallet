import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import Dialog from 'src/components/Dialog'
import i18n from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { WalletConnectSession } from 'src/walletConnect/types'
import { closeSession as closeSessionActionV1 } from 'src/walletConnect/v1/actions'
import { selectSessions as selectSessionsV1 } from 'src/walletConnect/v1/selectors'

type Session = WalletConnectSession

const App = ({
  metadata,
  onPress,
}: {
  metadata: WalletConnectSession['peerMeta'] | null
  onPress: () => void
}) => {
  const icon = metadata?.icons[0] || `${metadata?.url}/favicon.ico`
  const { t } = useTranslation()

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
  const { t } = useTranslation()
  const { sessions: sessionsV1 } = useSelector(selectSessionsV1)
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

    dispatch(closeSessionActionV1(highlighted))
    closeModal()
  }

  const dappName = highlighted?.peerMeta?.name
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
      </View>
    </ScrollView>
  )
}

function HeaderRight() {
  const onPress = () =>
    navigate(Screens.QRNavigator, {
      screen: Screens.QRScanner,
    })

  return <TopBarTextButton title={i18n.t('scan')} testID="ScanButton" onPress={onPress} />
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
