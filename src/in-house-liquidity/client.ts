import { SiweApiClient, SiweClient } from '@fiatconnect/fiatconnect-sdk'
import { getSiweSigningFunction } from 'src/fiatconnect/clients'
import { getWalletAsync } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'

const SIWE_STATEMENT = 'Sign in with Ethereum'
const SIWE_VERSION = '1'
const SESSION_DURATION_MS = 14400000 // 4 hours

let ihlClient: SiweApiClient

export const getClient = async (): Promise<SiweApiClient> => {
  if (!ihlClient) {
    const wallet = await getWalletAsync()
    const [account] = wallet.getAccounts()
    ihlClient = new SiweClient(
      {
        accountAddress: account,
        statement: SIWE_STATEMENT,
        version: SIWE_VERSION,
        chainId: parseInt(networkConfig.networkId),
        sessionDurationMs: SESSION_DURATION_MS,
        loginUrl: `${networkConfig.inHouseLiquidityURL}/auth/login`,
        clockUrl: `${networkConfig.inHouseLiquidityURL}/clock`,
      },
      getSiweSigningFunction(wallet)
    )
  }
  return ihlClient
}
