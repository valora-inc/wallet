import * as React from 'react'
import { StyleSheet } from 'react-native'
import Modal from 'src/components/Modal'
import { Spacing } from 'src/styles/styles'
import InLineNotification, { InLineNotificationProps } from 'src/components/InLineNotification'

type InLineNotificationModalProps = InLineNotificationProps & {
  onDismiss: () => void
  isVisible: boolean
}

export default function InLineNotificationModal({
  severity,
  title,
  description,
  style,
  ctaLabel,
  onPressCta,
  ctaLabel2,
  onPressCta2,
  testID,
  onDismiss,
  isVisible,
}: InLineNotificationModalProps) {
  return (
    <Modal
      modalStyle={styles.modalStyle}
      style={styles.modalContentStyle}
      isVisible={isVisible}
      onModalHide={onDismiss}
      onBackgroundPress={onDismiss}
    >
      <InLineNotification
        severity={severity}
        title={title}
        description={description}
        style={style}
        ctaLabel={ctaLabel}
        onPressCta={onPressCta}
        ctaLabel2={ctaLabel2}
        onPressCta2={onPressCta2}
        testID={testID}
      />
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalStyle: {
    justifyContent: 'flex-end',
    marginHorizontal: Spacing.Regular16,
    marginBottom: Spacing.XLarge48,
  },
  modalContentStyle: {
    padding: 0,
  },
})
