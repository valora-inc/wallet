import { isNil } from 'lodash'
import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { FIREBASE_ENABLED } from 'src/config'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { createDynamicLink } from './utils'

const TAG = 'InviteWithReferralURL'

export function useShareUrl() {
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const address = useSelector(walletAddressSelector)
  const { t } = useTranslation()
  const dispatch = useDispatch()

  useAsync(async () => {
    try {
      if (isNil(address) || !FIREBASE_ENABLED) {
        return
      } else {
        const url = await createDynamicLink(address)
        setShareUrl(url)
      }
    } catch (e) {
      Logger.debug(TAG, 'Error while creating a dynamic link', e)
      dispatch(showError(t('inviteWithUrl.error')))
    }
  }, [address])

  return shareUrl
}
