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
import { inviteRewardsActiveSelector, inviteRewardsVersionSelector } from 'src/send/selectors'

interface Props {
  recipient: Recipient
  onClose(): void
}

const InviteOptionsModal = ({ recipient, onClose }: Props) => {
  const { t } = useTranslation()
  const link = useShareUrl()
  const inviteRewardsActive = useSelector(inviteRewardsActiveSelector)
  const inviteRewardsVersion = useSelector(inviteRewardsVersionSelector)

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

  let title = t('inviteModal.title', { contactName: getDisplayName(recipient, t) })
  let description = t('inviteModal.body')
  let message = t('inviteModal.shareMessage', { link })
  if (inviteRewardsActive) {
    switch (inviteRewardsVersion) {
      case 'v4':
        title = t('inviteModal.rewardsActive.title', { contactName: getDisplayName(recipient, t) })
        description = t('inviteModal.rewardsActive.body', {
          contactName: getDisplayName(recipient, t),
        })
        message = t('inviteWithRewards', { link })
        break
      case 'v5':
        title = t('inviteModal.rewardsActiveV5.title', {
          contactName: getDisplayName(recipient, t),
        })
        description = t('inviteModal.rewardsActiveV5.body', {
          contactName: getDisplayName(recipient, t),
        })
        message = t('inviteWithRewardsV5', { link })
        break
    }
  }

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
