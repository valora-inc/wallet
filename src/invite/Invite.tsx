import { isNil } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { InviteEvents } from 'src/analytics/Events'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { InviteRewardsType } from 'src/send/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import InviteModal from './InviteModal'
import { useInviteReward, useShareUrl } from './hooks'

export default function Invite() {
  const { t } = useTranslation()
  const shareUrl = useShareUrl()
  const inviteReward = useInviteReward()
  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])

  let title = t('inviteWithUrl.title')
  let descriptionI18nKey = 'inviteWithUrl.body'
  let message = t('inviteWithUrl.share', { shareUrl })
  let helpLink = ''

  if (inviteReward.active) {
    switch (inviteReward.type) {
      case InviteRewardsType.NFT:
        title = t('inviteWithUrl.rewardsActive.title')
        descriptionI18nKey = 'inviteWithUrl.rewardsActive.body'
        message = t('inviteWithRewards', { link: shareUrl })
        helpLink = links.inviteRewardsNftsLearnMore
        break
      case InviteRewardsType.CUSD:
        title = t('inviteWithUrl.rewardsActiveCUSD.title')
        descriptionI18nKey = 'inviteWithUrl.rewardsActiveCUSD.body'
        message = t('inviteWithRewardsCUSD', { link: shareUrl })
        helpLink = links.inviteRewardsStableTokenLearnMore
        break
    }
  }

  const handleShare = async () => {
    if (shareUrl) {
      const result = await Share.share({ message })
      AppAnalytics.track(InviteEvents.invite_with_referral_url, result)
    }
  }

  return (
    <InviteModal
      title={title}
      descriptionI18nKey={descriptionI18nKey}
      buttonLabel={t('inviteWithUrl.button')}
      helpLink={helpLink}
      disabled={isNil(shareUrl)}
      onClose={navigateBack}
      onShareInvite={handleShare}
    />
  )
}

Invite.navOptions = noHeader
