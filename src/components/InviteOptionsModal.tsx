import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { useSelector } from 'react-redux'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { inviteModal } from 'src/images/Images'
import { useShareUrl } from 'src/invite/hooks'
import InviteModal from 'src/invite/InviteModal'
import { getDisplayName, Recipient } from 'src/recipients/recipient'
import { inviteRewardsActiveSelector } from 'src/send/selectors'

interface Props {
  recipient: Recipient
  onClose(): void
}

const InviteOptionsModal = ({ recipient, onClose }: Props) => {
  const { t } = useTranslation()
  const link = useShareUrl()
  const inviteRewardsEnabled = useSelector(inviteRewardsActiveSelector)

  const handleShareInvite = async () => {
    if (link) {
      await Share.share({ message })
      ValoraAnalytics.track(InviteEvents.invite_with_share, {
        phoneNumberHash: recipient.e164PhoneNumber ? getPhoneHash(recipient.e164PhoneNumber) : null,
      })
    }
  }

  const handleClose = () => {
    ValoraAnalytics.track(InviteEvents.invite_with_share_dismiss)
    onClose()
  }

  const title = inviteRewardsEnabled
    ? t('inviteModal.rewardsActive.title', { contactName: getDisplayName(recipient, t) })
    : t('inviteModal.title', { contactName: getDisplayName(recipient, t) })
  const description = inviteRewardsEnabled
    ? t('inviteModal.rewardsActive.body', { contactName: getDisplayName(recipient, t) })
    : t('inviteModal.body')
  const message = inviteRewardsEnabled
    ? t('inviteWithRewards', { link })
    : t('inviteModal.shareMessage', {
        link,
      })

  return (
    <InviteModal
      title={title}
      description={description}
      buttonLabel={t('inviteModal.sendInviteButtonLabel')}
      imageSource={inviteModal}
      disabled={!link}
      onClose={handleClose}
      onShareInvite={handleShareInvite}
    />
  )
}

export default InviteOptionsModal
