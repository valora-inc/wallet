import { isNil } from 'lodash'
import { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import { FIREBASE_ENABLED } from 'src/config'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { InviteRewardsType } from 'src/send/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { createInviteLink } from '../firebase/dynamicLinks'

const TAG = 'InviteWithReferralURL'

export function useShareUrl() {
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const address = useSelector(walletAddressSelector)
  const dispatch = useDispatch()

  useAsync(async () => {
    try {
      if (isNil(address) || !FIREBASE_ENABLED) {
        return
      } else {
        const url = await createInviteLink(address)
        setShareUrl(url)
      }
    } catch (e) {
      Logger.debug(TAG, 'Error while creating a dynamic link', e)
      dispatch(showError(ErrorMessages.INVITE_WITH_URL_FAILED))
    }
  }, [address])

  return shareUrl
}

export function useInviteReward() {
  const numberCentrallyVerified = useSelector(phoneNumberVerifiedSelector)
  const { inviteRewardsVersion } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.INVITE_REWARDS_CONFIG]
  )
  const type = useMemo(() => {
    if (inviteRewardsVersion === 'v4') return InviteRewardsType.NFT
    if (inviteRewardsVersion === 'v5') return InviteRewardsType.CUSD
    return InviteRewardsType.NONE
  }, [inviteRewardsVersion])

  const active = type !== InviteRewardsType.NONE && numberCentrallyVerified

  return { type, active }
}
