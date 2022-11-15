import { SiweApiClient, SiweClient } from '@fiatconnect/fiatconnect-sdk'
import { networkTimeoutSecondsSelector } from 'src/app/selectors'
import { getSiweSigningFunction } from 'src/fiatconnect/clients'
import { store } from 'src/redux/store'
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
        timeout: networkTimeoutSecondsSelector(store.getState()) * 1000,
      },
      getSiweSigningFunction(wallet)
    )
  }
  return ihlClient
}
