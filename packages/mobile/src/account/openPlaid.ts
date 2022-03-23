import { Platform } from 'react-native'
import {
  LinkEvent,
  LinkEventName,
  LinkExit,
  LinkSuccess,
  openLink,
} from 'react-native-plaid-link-sdk'
import { showError } from 'src/alert/actions'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { createLinkToken, verifyWalletAddress } from 'src/in-house-liquidity'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

const TAG = 'PLAID'

interface OpenPlaidParams {
  walletAddress: string | null
  locale: string | null
  phoneNumber: string | null
  onSuccess: (params: LinkSuccess) => void
  onExit: (params: LinkExit) => void
}

/**
 * Retrieves a plaid link token, opens the plaid link UI
 *
 *
 * @param {params.walletAddress} walletAddress
 * @param {params.locale} locale the users current locale
 * @param {params.phoneNumber} phoneNumber users verified phone number
 * @param {params.onSuccess} onSuccess function to be called when the user completes the plaid link flow
 * @param {params.phoneNumber} onExit function to be called when the user exits the plaid link flow unsuccessfully
 * @returns {Response} response object from the fetch call
 */
export default async function openPlaid({
  walletAddress,
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
      ...verifyWalletAddress({ walletAddress }),
      isAndroid,
      language: locale.split('-')[0], // ex: just en, not en-US
      phoneNumber,
    })
    return openLink({
      tokenConfig: {
        token: linkToken,
        noLoadingState: false,
      },
      onSuccess,
      onExit,
    })
  } catch (error) {
    Logger.warn(TAG, error)
    store.dispatch(showError(ErrorMessages.PLAID_CREATE_LINK_TOKEN_FAIL))
  }
}

/**
 * Logs analytics events for things that happen in the plaid flow
 *
 * Use with usePlaidEmitter https://plaid.com/docs/link/react-native/#onevent
 *
 */
export function handleOnEvent(linkEvent: LinkEvent) {
  const { eventName, metadata } = linkEvent
  const {
    linkSessionId,
    institutionId = 'N/A',
    institutionName = 'N/A',
    errorType = 'N/A',
    errorCode = 'N/A',
  } = metadata
  switch (eventName) {
    case LinkEventName.OPEN:
      return ValoraAnalytics.track(CICOEvents.plaid_open_link_flow, { linkSessionId })
    case LinkEventName.SELECT_INSTITUTION:
      return ValoraAnalytics.track(CICOEvents.plaid_select_institution, {
        linkSessionId,
        institutionId,
        institutionName,
      })
    case LinkEventName.SUBMIT_CREDENTIALS:
      return ValoraAnalytics.track(CICOEvents.plaid_submit_credentials, { linkSessionId })
    case LinkEventName.EXIT:
      return ValoraAnalytics.track(CICOEvents.plaid_exit, { linkSessionId })
    case LinkEventName.HANDOFF:
      return ValoraAnalytics.track(CICOEvents.plaid_handoff, { linkSessionId })
    case LinkEventName.ERROR:
      return ValoraAnalytics.track(CICOEvents.plaid_error, { linkSessionId, errorCode, errorType })
  }
}
