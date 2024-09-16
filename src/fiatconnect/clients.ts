import { FiatConnectApiClient, FiatConnectClient } from '@fiatconnect/fiatconnect-sdk'
import { FIATCONNECT_NETWORK } from 'src/config'
import { getPassword } from 'src/pincode/authentication'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { KeychainAccounts } from 'src/web3/KeychainAccounts'
import { UNLOCK_DURATION } from 'src/web3/consts'
import { getKeychainAccounts } from 'src/web3/contracts'

const fiatConnectClients: Record<
  string,
  { url: string; apiKey: string | undefined; client: FiatConnectApiClient }
> = {}

/**
 * A helper function used by SIWE clients for signing SIWE login messages
 *
 * @param wallet
 */
export function getSiweSigningFunction(
  keychainAccounts: KeychainAccounts
): (message: string) => Promise<string> {
  return async function (message: string): Promise<string> {
    const [account] = keychainAccounts.getAccounts()
    if (!keychainAccounts.isUnlocked(account)) {
      await keychainAccounts.unlock(account, await getPassword(account), UNLOCK_DURATION)
    }
    const viemAccount = keychainAccounts.getViemAccount(account)
    if (!viemAccount) {
      // This should never happen
      throw new Error('Viem account not found')
    }
    return await viemAccount.signMessage({ message })
  }
}

export async function getFiatConnectClient(
  providerId: string,
  providerBaseUrl: string,
  providerApiKey?: string
): Promise<FiatConnectApiClient> {
  if (
    !fiatConnectClients[providerId] ||
    fiatConnectClients[providerId].url !== providerBaseUrl ||
    fiatConnectClients[providerId].apiKey !== providerApiKey
  ) {
    const accounts = await getKeychainAccounts()
    const [account] = accounts.getAccounts()
    fiatConnectClients[providerId] = {
      url: providerBaseUrl,
      apiKey: providerApiKey,
      client: new FiatConnectClient(
        {
          baseUrl: providerBaseUrl,
          network: FIATCONNECT_NETWORK,
          accountAddress: account,
          apiKey: providerApiKey,
          timeout:
            getDynamicConfigParams(
              DynamicConfigs[StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS]
            ).cico * 1000,
        },
        getSiweSigningFunction(accounts)
      ),
    }
  }
  return fiatConnectClients[providerId].client
}
