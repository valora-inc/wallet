import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import Dialog from 'src/components/Dialog'
import fontStyles from 'src/styles/fonts'

interface Props {
  isVisible: boolean
  onPressDismiss: () => void
}

export default function InterestsLearnMoreDialog({ isVisible, onPressDismiss }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog
      testID="InterestsLearnMoreDialog"
      title={t('InterestsLearnMoreDialog.title')}
      isVisible={isVisible}
      actionText={t('InterestsLearnMoreDialog.dismiss')}
      actionPress={onPressDismiss}
      isActionHighlighted={false}
      onBackgroundPress={onPressDismiss}
    >
      <Trans i18nKey="InterestsLearnMoreDialog.body">
        <Text style={fontStyles.regular600} />
        <Text style={fontStyles.regular600} />
      </Trans>
    </Dialog>
  )
}
