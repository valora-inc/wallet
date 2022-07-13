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
  providerBaseUrl: string
): Promise<FiatConnectApiClient> {
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
        },
        getSigningFunction(wallet)
      ),
    }
  }
  return fiatConnectClients[providerId].client
}
