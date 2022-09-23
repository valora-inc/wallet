import { isNil } from 'lodash'
import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { useSelector } from 'react-redux'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FIREBASE_ENABLED } from 'src/config'

import { walletAddressSelector } from 'src/web3/selectors'

import { createDynamicLink } from './utils'

export function useShareUrl() {
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const address = useSelector(walletAddressSelector)
  const { t } = useTranslation()

  const message = isNil(shareUrl) ? null : t('inviteWithUrl.share', { shareUrl })

  useAsync(async () => {
    if (isNil(address) || !FIREBASE_ENABLED) return
    const url = await createDynamicLink(address)
    setShareUrl(url)
  }, [address])

  return isNil(message)
    ? null
    : async () => {
        const result = await Share.share({ message })
        ValoraAnalytics.track(InviteEvents.invite_with_referral_url, result)
      }
}
