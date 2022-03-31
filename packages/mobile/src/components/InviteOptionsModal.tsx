import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import Modal from 'src/components/Modal'
import TextButton from 'src/components/TextButton'
import SmsIcon from 'src/icons/SmsIcon'
import WhatsAppLogo from 'src/icons/WhatsAppLogo'
import colors from 'src/styles/colors'

interface Props {
  isVisible: boolean
  onCancel: () => void
  onWhatsApp: () => void
  onSMS: () => void
}

const InviteOptionsModal = ({ onCancel, onWhatsApp, onSMS, isVisible }: Props) => {
  const { t } = useTranslation()

  return (
    <Modal isVisible={isVisible} style={styles.container}>
      <View style={styles.buttonContainer}>
        <SmsIcon />
        <TextButton style={styles.buttonText} onPress={onSMS}>
          {t('inviteWithSMS')}
        </TextButton>
      </View>
      <View style={styles.buttonContainer}>
        <WhatsAppLogo />
        <TextButton style={styles.buttonText} onPress={onWhatsApp}>
          {t('inviteWithWhatsapp')}
        </TextButton>
      </View>
      <View style={styles.buttonContainer}>
        <TextButton onPress={onCancel}>{t('cancel')}</TextButton>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  buttonText: {
    paddingLeft: 8,
    color: colors.dark,
  },
})

export default InviteOptionsModal
