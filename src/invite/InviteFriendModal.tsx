import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { toggleInviteModal } from 'src/app/actions'
import Dialog from 'src/components/Dialog'
import { inviteModal } from 'src/images/Images'
import Logger from 'src/utils/Logger'

interface Props {
  isVisible: boolean
  onInvite: () => Promise<void>
  onCancel?: () => void
}

const InviteFriendModal = ({ isVisible, onInvite, onCancel }: Props) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()

  const onPressInvite = async () => {
    setLoading(true)
    try {
      await onInvite()
    } catch (error) {
      Logger.error('InviteFriendModal', 'Failed to invite:', error)
    }
    setLoading(false)
    closeModal()
  }

  const closeModal = () => {
    onCancel?.()
    dispatch(toggleInviteModal(false))
  }

  return (
    <Dialog
      title={t('inviteDialog.title')}
      isVisible={isVisible}
      actionText={t('inviteDialog.button')}
      actionPress={onPressInvite}
      secondaryActionText={t('cancel')}
      secondaryActionPress={closeModal}
      image={inviteModal}
      showLoading={loading}
      testID="InviteFriendModal"
    >
      {t('inviteDialog.body')}
    </Dialog>
  )
}

export default InviteFriendModal
