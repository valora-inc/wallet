import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import Dialog from 'src/components/Dialog'

interface Props {
  isVisible: boolean
  onPressDismiss: () => void
}

export default function VerificationLearnMoreDialog({ isVisible, onPressDismiss }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog
      title={t('verificationLearnMoreDialog.title')}
      isVisible={isVisible}
      actionText={t('verificationLearnMoreDialog.dismiss')}
      actionPress={onPressDismiss}
    >
      <Trans i18nKey="verificationLearnMoreDialog.body">
        <Text style={fontStyles.regular600} />
        <Text style={fontStyles.regular600} />
      </Trans>
    </Dialog>
  )
}
