import { isNil } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { InviteEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { INVITE_REWARDS_NFTS_LEARN_MORE, INVITE_REWARDS_STABLETOKEN_LEARN_MORE } from 'src/config'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { useSelector } from 'src/redux/hooks'
import { inviteRewardsActiveSelector, inviteRewardsTypeSelector } from 'src/send/selectors'
import { InviteRewardsType } from 'src/send/types'
import InviteModal from './InviteModal'
import { useShareUrl } from './hooks'

export default function Invite() {
  const { t } = useTranslation()
  const shareUrl = useShareUrl()
  const inviteRewardsActive = useSelector(inviteRewardsActiveSelector)
  const inviteRewardsType = useSelector(inviteRewardsTypeSelector)

  let title = t('inviteWithUrl.title')
  let descriptionI18nKey = 'inviteWithUrl.body'
  let message = t('inviteWithUrl.share', { shareUrl })
  let helpLink = ''

  if (inviteRewardsActive) {
    switch (inviteRewardsType) {
      case InviteRewardsType.NFT:
        title = t('inviteWithUrl.rewardsActive.title')
        descriptionI18nKey = 'inviteWithUrl.rewardsActive.body'
        message = t('inviteWithRewards', { link: shareUrl })
        helpLink = INVITE_REWARDS_NFTS_LEARN_MORE
        break
      case InviteRewardsType.CUSD:
        title = t('inviteWithUrl.rewardsActiveCUSD.title')
        descriptionI18nKey = 'inviteWithUrl.rewardsActiveCUSD.body'
        message = t('inviteWithRewardsCUSD', { link: shareUrl })
        helpLink = INVITE_REWARDS_STABLETOKEN_LEARN_MORE
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
