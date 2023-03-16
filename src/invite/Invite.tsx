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
import { inviteRewardsActiveSelector, inviteRewardsVersionSelector } from 'src/send/selectors'
import { useShareUrl } from './hooks'
import InviteModal from './InviteModal'

export default function Invite() {
  const { t } = useTranslation()
  const shareUrl = useShareUrl()
  const inviteRewardsActive = useSelector(inviteRewardsActiveSelector)
  const inviteRewardsVersion = useSelector(inviteRewardsVersionSelector)

  let title = t('inviteWithUrl.title')
  let description = t('inviteWithUrl.body')
  let message = t('inviteWithUrl.share', { shareUrl })
  let image = inviteModal

  if (inviteRewardsActive) {
    switch (inviteRewardsVersion) {
      case 'v4':
        title = t('inviteWithUrl.rewardsActive.title')
        description = t('inviteWithUrl.rewardsActive.body')
        message = t('inviteWithRewards', { link: shareUrl })
        image = inviteWithRewards
        break
      case 'v5':
        title = t('inviteWithUrl.rewardsActiveV5.title')
        description = t('inviteWithUrl.rewardsActiveV5.body')
        message = t('inviteWithRewardsV5', { link: shareUrl })
        break
    }
  }

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
