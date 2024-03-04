import { CoreTypes, SessionTypes } from '@walletconnect/types'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import Dialog from 'src/components/Dialog'
import QrScanButton from 'src/components/QrScanButton'
import Touchable from 'src/components/Touchable'
import { headerWithBackButton } from 'src/navigator/Headers'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { closeSession as closeSessionAction } from 'src/walletConnect/actions'
import { selectSessions } from 'src/walletConnect/selectors'

type Session = SessionTypes.Struct

const Dapp = ({
  metadata,
  onPress,
}: {
  metadata: CoreTypes.Metadata | null
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

    dispatch(closeSessionAction(highlighted))
    closeModal()
  }

  const dappName = highlighted && highlighted?.peer.metadata.name

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

      {sessions.map((s) => (
        <Dapp key={s.topic} metadata={s.peer.metadata} onPress={openModal(s)} />
      ))}
    </ScrollView>
  )
}

Sessions.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerRight: () => <QrScanButton testID="ScanButton" />,
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
    color: colors.black,
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
    color: colors.black,
  },
  disconnectButton: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})

export default Sessions
