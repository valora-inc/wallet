import networkConfig from 'src/geth/networkConfig'
import Logger from '../utils/Logger'

const TAG = 'FIATCONNECT'

export interface FiatConnectClientConfig {
  // todo eventually: get from SDK (once it is published to NPM)
  baseUrl: string
  providerName: string
  iconUrl: string
}

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
