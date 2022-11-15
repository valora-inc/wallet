import React from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'src/components/Dialog'
import { inviteModal } from 'src/images/Images'
import useSelector from 'src/redux/useSelector'
import { inviteRewardsActiveSelector } from 'src/send/selectors'

interface Props {
  isVisible: boolean
  name: string
  onInvite: () => void
  onCancel?: () => void
}

export default function InviteAndSendModal({ isVisible, name, onInvite, onCancel }: Props) {
  const { t } = useTranslation()
  const inviteRewardsEnabled = useSelector(inviteRewardsActiveSelector)

  return (
    <Dialog
      title={t('inviteAndSendDialog.title', { name })}
      isVisible={isVisible}
      actionText={t('inviteAndSendDialog.button')}
      actionPress={onInvite}
      secondaryActionText={t('cancel')}
      secondaryActionPress={onCancel}
      image={inviteModal}
      testID="InviteAndSendModal"
    >
      {inviteRewardsEnabled
        ? t('inviteAndSendDialog.bodyWithRewards', { name })
        : t('inviteAndSendDialog.body', { name })}
    </Dialog>
  )
}
