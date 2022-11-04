import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { DYNAMIC_DOWNLOAD_LINK } from 'src/config'
import { inviteModal } from 'src/images/Images'
import InviteModal from 'src/invite/InviteModal'
import { getDisplayName, Recipient } from 'src/recipients/recipient'

interface Props {
  recipient: Recipient
  onClose(): void
}

const InviteOptionsModal = ({ recipient, onClose }: Props) => {
  const { t } = useTranslation()

  const handleShareInvite = async () => {
    const message = t('inviteModal.shareMessage', {
      link: DYNAMIC_DOWNLOAD_LINK,
    })
    ValoraAnalytics.track(InviteEvents.invite_with_share, {
      phoneNumberHash: recipient.e164PhoneNumber ? getPhoneHash(recipient.e164PhoneNumber) : null,
    })
    await Share.share({ message })
  }

  const handleClose = () => {
    ValoraAnalytics.track(InviteEvents.invite_with_share_dismiss)
    onClose()
  }

  return (
    <InviteModal
      title={t('inviteModal.title', { contactName: getDisplayName(recipient, t) })}
      description={t('inviteModal.body')}
      buttonLabel={t('inviteModal.sendInviteButtonLabel')}
      imageSource={inviteModal}
      disabled={false}
      onClose={handleClose}
      onShareInvite={handleShareInvite}
    />
  )
}

export default InviteOptionsModal
