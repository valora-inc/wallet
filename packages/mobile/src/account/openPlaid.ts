import { Platform } from 'react-native'
import { openLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { createLinkToken } from 'src/in-house-liquidity'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

const TAG = 'PLAID'

interface OpenPlaidParams {
  accountMTWAddress: string | null
  dekPrivate: string | null
  locale: string | null
  phoneNumber: string | null
  onSuccess: (params: LinkSuccess) => void
  onExit: (params: LinkExit) => void
}

/**
 * Retrieves a plaid link token, opens the plaid link UI
 *
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @param {params.locale} locale the users current locale
 * @param {params.phoneNumber} phoneNumber users verified phone number
 * @param {params.onSuccess} onSuccess function to be called when the user completes the plaid link flow
 * @param {params.phoneNumber} onExit function to be called when the user exits the plaid link flow unsuccessfully
 * @returns {Response} response object from the fetch call
 */
export default async function openPlaid({
  accountMTWAddress,
  dekPrivate,
  locale,
  phoneNumber,
  onSuccess,
  onExit,
}: OpenPlaidParams) {
  locale = locale || ''
  phoneNumber = phoneNumber || ''
  const isAndroid = Platform.OS === 'android'
  try {
    const linkToken = await createLinkToken({
      accountMTWAddress,
      dekPrivate,
      isAndroid,
      language: locale.split('-')[0], // ex: just en, not en-US
      phoneNumber,
    })
    return openLink({
      tokenConfig: { token: linkToken },
      onSuccess,
      onExit,
    })
  } catch (error) {
    Logger.warn(TAG, error)
    store.dispatch(showError(ErrorMessages.PLAID_CREATE_LINK_TOKEN_FAIL))
  }
}
