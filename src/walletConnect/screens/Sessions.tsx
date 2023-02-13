import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import Dialog from 'src/components/Dialog'
import Touchable from 'src/components/Touchable'
import i18n from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { WalletConnectSession } from 'src/walletConnect/types'
import { closeSession as closeSessionActionV1 } from 'src/walletConnect/v1/actions'
import { selectSessions as selectSessionsV1 } from 'src/walletConnect/v1/selectors'
import { closeSession as closeSessionActionV2 } from 'src/walletConnect/v2/actions'
import { selectSessions as selectSessionsV2 } from 'src/walletConnect/v2/selectors'

type Session = WalletConnectSession | SessionTypes.Struct

const isWCv2Session = (session: Session): session is SessionTypes.Struct => {
  return 'topic' in session
}

const Dapp = ({
  metadata,
  onPress,
}: {
  metadata: SignClientTypes.Metadata | null
  onPress: () => void
}) => {
  const icon = metadata?.icons[0] || `${metadata?.url}/favicon.ico`
  const { t } = useTranslation()

  return (
    <Touchable onPress={onPress}>
      <View style={styles.row}>
        <Image source={{ uri: icon }} style={styles.icon} />
        <View style={styles.rowContent}>
          <Text style={styles.appName}>{metadata?.name}</Text>
          <Text style={styles.disconnectButton}>{t('tapToDisconnect')}</Text>
        </View>
      </View>
    </Touchable>
  )
}

function Sessions() {
  const { t } = useTranslation()
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
      isWCv2Session(highlighted)
        ? closeSessionActionV2(highlighted)
        : closeSessionActionV1(highlighted)
    )
    closeModal()
  }

  const dappName =
    highlighted && isWCv2Session(highlighted)
      ? highlighted?.peer.metadata.name
      : highlighted?.peerMeta?.name

  return (
    <ScrollView testID="WalletConnectSessionsView" style={styles.container}>
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

      <Text style={styles.title}>{t('sessionsTitle')}</Text>
      <Text style={styles.subTitle}>{t('sessionsSubTitle')}</Text>

      {sessionsV1.map((s) => (
        <Dapp key={s.peerId} metadata={s.peerMeta} onPress={openModal(s)} />
      ))}
      {sessionsV2.map((s) => (
        <Dapp key={s.topic} metadata={s.peer.metadata} onPress={openModal(s)} />
      ))}
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
    paddingVertical: Spacing.Regular16,
  },
  subTitle: {
    ...fontStyles.regular,
    color: colors.dark,
    paddingBottom: Spacing.Thick24,
  },

  // connected apps
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.Small12,
  },
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
