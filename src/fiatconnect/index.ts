import networkConfig from 'src/geth/networkConfig'
import Logger from '../utils/Logger'
import { FiatConnectApiClient, FiatConnectClientConfig } from '@fiatconnect/fiatconnect-sdk'
import { GethNativeBridgeWallet } from 'src/geth/GethNativeBridgeWallet'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { getPassword } from 'src/pincode/authentication'

const TAG = 'FIATCONNECT'

/**
 * Get a list of FiatConnect providers.
 *
 * Queries a cloud function for static information about FiatConnect providers.
 */
export async function getFiatConnectProviders(): Promise<FiatConnectClientConfig[]> {
  const response = await fetch(networkConfig.getFiatConnectProvidersUrl)
  if (!response.ok) {
    Logger.error(
      TAG,
      `Failure response fetching FiatConnect providers: ${response} , returning empty list`
    )
    return []
  }
  const { providers } = await response.json()
  return providers
}

/**
 * Logs in with a FiatConnect provider. Will not attempt to log in if an
 * unexpired session already exists, unless the `forceLogin` flag is set to `true`.
 */
export async function loginWithFiatConnectProvider(
  wallet: GethNativeBridgeWallet,
  fiatConnectClient: FiatConnectApiClient,
  forceLogin: boolean = false
): Promise<void> {
  if (fiatConnectClient.isLoggedIn() && !forceLogin) {
    return
  }

  const [account] = wallet.getAccounts()
  if (!wallet.isAccountUnlocked(account)) {
    await wallet.unlockAccount(account, await getPassword(account), UNLOCK_DURATION)
  }

  const response = await fiatConnectClient.login()
  if (!response.ok) {
    throw new Error(response.val.error)
  }
}

export function getSigningFunction(
  wallet: GethNativeBridgeWallet
): (message: string) => Promise<string> {
  return async function (message: string): Promise<string> {
    const [account] = wallet.getAccounts()
    const signedMessage = await wallet.signPersonalMessage(account, message)
    Logger.info(TAG, signedMessage)
    return signedMessage
  }
}
