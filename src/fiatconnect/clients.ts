import { UnlockableWallet } from '@celo/wallet-base'
import { FiatConnectApiClient, FiatConnectClient } from '@fiatconnect/fiatconnect-sdk'
import { FIATCONNECT_NETWORK } from 'src/config'
import { getPassword } from 'src/pincode/authentication'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { ensureLeading0x } from 'src/utils/address'
import { UNLOCK_DURATION } from 'src/web3/consts'
import { getWalletAsync } from 'src/web3/contracts'

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
  wallet: UnlockableWallet
): (message: string) => Promise<string> {
  return async function (message: string): Promise<string> {
    const [account] = wallet.getAccounts()
    if (!wallet.isAccountUnlocked(account)) {
      await wallet.unlockAccount(account, await getPassword(account), UNLOCK_DURATION)
    }
    const encodedMessage = ensureLeading0x(Buffer.from(message, 'utf8').toString('hex'))
    return await wallet.signPersonalMessage(account, encodedMessage)
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
    const wallet = (await getWalletAsync()) as UnlockableWallet
    const [account] = wallet.getAccounts()
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
        getSiweSigningFunction(wallet)
      ),
    }
  }
  return fiatConnectClients[providerId].client
}
