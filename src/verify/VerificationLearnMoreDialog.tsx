import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import Dialog from 'src/components/Dialog'
import fontStyles from 'src/styles/fonts'

interface Props {
  isVisible: boolean
  onPressDismiss: () => void
}

export default function VerificationLearnMoreDialog({ isVisible, onPressDismiss }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog
      testID="VerificationLearnMoreDialog"
      title={t('verificationLearnMoreDialog.title')}
      isVisible={isVisible}
      actionText={t('verificationLearnMoreDialog.dismiss')}
      actionPress={onPressDismiss}
      isActionHighlighted={false}
      onBackgroundPress={onPressDismiss}
    >
      <Trans i18nKey="verificationLearnMoreDialog.body">
        <Text style={fontStyles.regular600} />
        <Text style={fontStyles.regular600} />
      </Trans>
    </Dialog>
  )
}
