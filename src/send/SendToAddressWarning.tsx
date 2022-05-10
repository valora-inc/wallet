import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Modal from 'src/components/Modal'
import TextButton from 'src/components/TextButton'
import { Recipient } from 'src/recipients/recipient'
import { setShowWarning } from 'src/send/actions'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  onSelectRecipient: (recipient: Recipient) => void
  closeWarning: () => void
  isVisible: boolean
  recipient: Recipient
}

export default function SendToAddressWarning({
  onSelectRecipient,
  closeWarning,
  isVisible,
  recipient,
}: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const onContinue = () => {
    closeWarning()
    onSelectRecipient(recipient)
    ValoraAnalytics.track(SendEvents.check_account_alerts_continue)
  }

  const turnOffWarning = () => {
    closeWarning()
    dispatch(setShowWarning(false))
    ValoraAnalytics.track(SendEvents.check_account_do_not_ask_selected)
  }

  return (
    <Modal isVisible={isVisible}>
      <ScrollView contentContainerStyle={styles.root}>
        <Text style={styles.title}>{t('sendToAddressWarning.title')}</Text>
        <Text style={styles.body}>{t('sendToAddressWarning.body')}</Text>
        <View style={styles.toggle}>
          <Switch
            trackColor={{ true: colors.greenUI, false: colors.gray5 }}
            thumbColor={colors.gray2}
            value={true}
            onValueChange={turnOffWarning}
            style={styles.switch}
          />
          <Text style={styles.body}>{t('sendToAddressWarning.toggle')}</Text>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <TextButton
          style={styles.secondary}
          onPress={closeWarning}
          testID={'SendToAddressWarning/Back'}
        >
          {t('goBack')}
        </TextButton>
        <TextButton onPress={onContinue} testID={'SendToAddressWarning/Continue'}>
          {t('continue')}
        </TextButton>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    ...fontStyles.h2,
  },
  body: {
    textAlign: 'center',
    ...fontStyles.regular,
  },
  toggle: {
    marginTop: 24,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: colors.gray2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    marginBottom: 36,
  },
  switch: {
    marginRight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  secondary: {
    color: colors.gray4,
  },
})
