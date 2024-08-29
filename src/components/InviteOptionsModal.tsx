import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { InviteEvents } from 'src/analytics/Events'
import { INVITE_REWARDS_NFTS_LEARN_MORE, INVITE_REWARDS_STABLETOKEN_LEARN_MORE } from 'src/config'
import InviteModal from 'src/invite/InviteModal'
import { useShareUrl } from 'src/invite/hooks'
import { Recipient, getDisplayName } from 'src/recipients/recipient'
import { useSelector } from 'src/redux/hooks'
import { inviteRewardsActiveSelector, inviteRewardsTypeSelector } from 'src/send/selectors'
import { InviteRewardsType } from 'src/send/types'
import getPhoneHash from 'src/utils/getPhoneHash'

interface Props {
  recipient: Recipient
  onClose(): void
}

const InviteOptionsModal = ({ recipient, onClose }: Props) => {
  const { t } = useTranslation()
  const link = useShareUrl()
  const inviteRewardsActive = useSelector(inviteRewardsActiveSelector)
  const inviteRewardsType = useSelector(inviteRewardsTypeSelector)

  const handleShareInvite = async () => {
    if (link) {
      await Share.share({ message })
      AppAnalytics.track(InviteEvents.invite_with_share, {
        phoneNumberHash: recipient.e164PhoneNumber ? getPhoneHash(recipient.e164PhoneNumber) : null,
      })
    }
  }

  const handleClose = () => {
    AppAnalytics.track(InviteEvents.invite_with_share_dismiss)
    onClose()
  }

  let title = t('inviteModal.title', { contactName: getDisplayName(recipient, t) })
  let descriptionI18nKey = 'inviteModal.body'
  let message = t('inviteModal.shareMessage', { link })
  let helpLink = ''

  if (inviteRewardsActive) {
    switch (inviteRewardsType) {
      case InviteRewardsType.NFT:
        title = t('inviteModal.rewardsActive.title', { contactName: getDisplayName(recipient, t) })
        descriptionI18nKey = 'inviteModal.rewardsActive.body'
        message = t('inviteWithRewards', { link })
        helpLink = INVITE_REWARDS_NFTS_LEARN_MORE
        break
      case InviteRewardsType.CUSD:
        title = t('inviteModal.rewardsActiveCUSD.title', {
          contactName: getDisplayName(recipient, t),
        })
        descriptionI18nKey = 'inviteModal.rewardsActiveCUSD.body'
        message = t('inviteWithRewardsCUSD', { link })
        helpLink = INVITE_REWARDS_STABLETOKEN_LEARN_MORE
        break
    }
  }

  return (
    <InviteModal
      title={title}
      descriptionI18nKey={descriptionI18nKey}
      contactName={getDisplayName(recipient, t)}
      buttonLabel={t('inviteModal.sendInviteButtonLabel')}
      disabled={!link}
      helpLink={helpLink}
      onClose={handleClose}
      onShareInvite={handleShareInvite}
    />
  )
}

export default InviteOptionsModal
