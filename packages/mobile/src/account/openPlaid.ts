import { Platform } from 'react-native'
import { openLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { createLinkToken } from 'src/in-house-liquidity'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'
import { e164NumberSelector } from 'src/verify/reducer'
import {
  dataEncryptionKeySelector,
  mtwAddressSelector,
  walletAddressSelector,
} from 'src/web3/selectors'
import { navigate } from 'src/navigator/NavigationService'

const TAG = 'PLAID'

interface OpenPlaidParams {
  accountMTWAddress: string | null
  dekPrivate: string | null
  locale: string | null
  phoneNumber: string | null
  onSuccess: (params: LinkSuccess) => void
  onExit: (params: LinkExit) => void
}

export default async function openPlaid({
  accountMTWAddress,
  dekPrivate,
  locale = '',
  phoneNumber = '',
  onSuccess,
  onExit,
}: OpenPlaidParams) {
  locale = locale || ''
  phoneNumber = phoneNumber || ''
  const isAndroid = Platform.OS === 'android'
  if (!accountMTWAddress) {
    Logger.warn(TAG, "Can't render Plaid because accountMTWAddress is null")
    return
  }
  if (!dekPrivate) {
    Logger.error(TAG, "Can't render Plaid because dekPrivate is null")
    return
  }
  const linkTokenResponse = await createLinkToken({
    accountMTWAddress,
    dekPrivate,
    isAndroid,
    language: locale.split('-')[0], // ex: just en, not en-US
    phoneNumber,
  })
  if (!linkTokenResponse.ok) {
    store.dispatch(showError(ErrorMessages.PLAID_CREATE_LINK_TOKEN_FAIL))
    return
  }
  const { linkToken } = await linkTokenResponse.json()
  return openLink({
    tokenConfig: { token: linkToken },
    onSuccess,
    onExit,
  })
}
