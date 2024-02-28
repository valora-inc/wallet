import * as React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import Modal from 'src/components/Modal'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import ExclamationMark from 'src/icons/ExclamationMark'
import { useTranslation } from 'react-i18next'
import { typeScale } from 'src/styles/fonts'

interface Props {
  text: string
  isVisible: boolean
  testID: string
  onDismiss: () => void
}

export default function ErrorBanner({ text, isVisible, testID, onDismiss }: Props) {
  const { t } = useTranslation()

  return (
    <Modal
      modalStyle={styles.modalStyle}
      style={styles.modalContentStyle}
      isVisible={isVisible}
      testID={testID}
      onModalHide={onDismiss}
      onBackgroundPress={onDismiss}
    >
      <View style={styles.primaryContainer}>
        <View style={styles.titleRow}>
          <ExclamationMark size={24} />
          <Text style={styles.title}>{t('error')}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bodyText}>{text}</Text>
          <Text style={styles.dismissText} testID={`${testID}/Dismiss`} onPress={onDismiss}>
            {t('dismiss')}
          </Text>
        </View>
      </View>
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
    padding: Spacing.Thick24,
    backgroundColor: colors.warningLight,
  },
  primaryContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  textContainer: {
    flexDirection: 'column',
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingBottom: Spacing.Tiny4,
    paddingLeft: Spacing.Tiny4,
  },
  title: {
    ...typeScale.labelSemiBoldSmall,
    paddingLeft: Spacing.Tiny4,
  },
  bodyText: {
    paddingHorizontal: Spacing.Large32,
  },
  dismissText: {
    ...typeScale.labelSemiBoldSmall,
    paddingTop: Spacing.Small12,
    alignSelf: 'flex-end',
    color: colors.warningDark,
    paddingRight: Spacing.Thick24,
  },
})
