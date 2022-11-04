import { isNil } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { useSelector } from 'react-redux'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { inviteModal, inviteWithRewards } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { inviteRewardsActiveSelector } from 'src/send/selectors'
import { useShareUrl } from './hooks'
import InviteModal from './InviteModal'

export default function Invite() {
  const { t } = useTranslation()
  const shareUrl = useShareUrl()
  const inviteRewardsEnabled = useSelector(inviteRewardsActiveSelector)

  const title = inviteRewardsEnabled
    ? t('inviteWithUrl.rewardsActive.title')
    : t('inviteWithUrl.title')
  const description = inviteRewardsEnabled
    ? t('inviteWithUrl.rewardsActive.body')
    : t('inviteWithUrl.body')
  const image = inviteRewardsEnabled ? inviteWithRewards : inviteModal
  const message = inviteRewardsEnabled
    ? t('inviteWithRewards', { link: shareUrl })
    : t('inviteWithUrl.share', { shareUrl })

  const handleShare = async () => {
    if (shareUrl) {
      const result = await Share.share({ message })
      ValoraAnalytics.track(InviteEvents.invite_with_referral_url, result)
    }
  }

  return (
    <InviteModal
      title={title}
      description={description}
      buttonLabel={t('inviteWithUrl.button')}
      imageSource={image}
      disabled={isNil(shareUrl)}
      onClose={navigateBack}
      onShareInvite={handleShare}
    />
  )
}

Invite.navOptions = noHeader
