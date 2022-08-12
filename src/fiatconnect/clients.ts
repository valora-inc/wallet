import { ensureLeading0x } from '@celo/utils/lib/address'
import { UnlockableWallet } from '@celo/wallet-base'
import { FiatConnectApiClient, FiatConnectClient } from '@fiatconnect/fiatconnect-sdk'
import { FIATCONNECT_NETWORK } from 'src/config'
import { getPassword } from 'src/pincode/authentication'
import { UNLOCK_DURATION } from 'src/web3/consts'
import { getWalletAsync } from 'src/web3/contracts'

const fiatConnectClients: Record<string, { url: string; client: FiatConnectApiClient }> = {}

export function getSigningFunction(wallet: UnlockableWallet): (message: string) => Promise<string> {
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
  //TODO: I don't think the second check actually does anything. Testing with manually changing the url didn't update the baseUrl
  if (!fiatConnectClients[providerId] || fiatConnectClients[providerId].url !== providerBaseUrl) {
    const wallet = (await getWalletAsync()) as UnlockableWallet
    const [account] = wallet.getAccounts()
    fiatConnectClients[providerId] = {
      url: providerBaseUrl,
      client: new FiatConnectClient(
        {
          baseUrl: providerBaseUrl,
          network: FIATCONNECT_NETWORK,
          accountAddress: account,
          apiKey: providerApiKey,
        },
        getSigningFunction(wallet)
      ),
    }
  }
  return fiatConnectClients[providerId].client
}
