import { isNil } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { useSelector } from 'react-redux'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { INVITE_REWARDS_NFTS_LEARN_MORE, INVITE_REWARDS_STABLETOKEN_LEARN_MORE } from 'src/config'
import { inviteModal, inviteWithRewards } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { inviteRewardsActiveSelector, inviteRewardsTypeSelector } from 'src/send/selectors'
import { useShareUrl } from './hooks'
import InviteModal from './InviteModal'

export default function Invite() {
  const { t } = useTranslation()
  const shareUrl = useShareUrl()
  const inviteRewardsActive = useSelector(inviteRewardsActiveSelector)
  const inviteRewardsType = useSelector(inviteRewardsTypeSelector)

  let title = t('inviteWithUrl.title')
  let descriptionProps = { i18nKey: 'inviteWithUrl.body' }
  let message = t('inviteWithUrl.share', { shareUrl })
  let image = inviteModal
  let helpLink = ''

  if (inviteRewardsActive) {
    switch (inviteRewardsType) {
      case 'nft':
        title = t('inviteWithUrl.rewardsActive.title')
        descriptionProps.i18nKey = 'inviteWithUrl.rewardsActive.body'
        message = t('inviteWithRewards', { link: shareUrl })
        helpLink = INVITE_REWARDS_NFTS_LEARN_MORE
        image = inviteWithRewards
        break
      case 'cUSD':
        title = t('inviteWithUrl.rewardsActiveCUSD.title')
        descriptionProps.i18nKey = 'inviteWithUrl.rewardsActiveCUSD.body'
        message = t('inviteWithRewardsCUSD', { link: shareUrl })
        helpLink = INVITE_REWARDS_STABLETOKEN_LEARN_MORE
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
      descriptionProps={descriptionProps}
      buttonLabel={t('inviteWithUrl.button')}
      imageSource={image}
      helpLink={helpLink}
      disabled={isNil(shareUrl)}
      onClose={navigateBack}
      onShareInvite={handleShare}
    />
  )
}

Invite.navOptions = noHeader
