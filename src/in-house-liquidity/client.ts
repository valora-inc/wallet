import { SiweApiClient, SiweClient } from '@fiatconnect/fiatconnect-sdk'
import { getSiweSigningFunction } from 'src/fiatconnect/clients'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { getKeychainAccounts } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'

const SIWE_STATEMENT = 'Sign in with Ethereum'
const SIWE_VERSION = '1'
const SESSION_DURATION_MS = 14400000 // 4 hours

let ihlClient: SiweApiClient

export const getClient = async (): Promise<SiweApiClient> => {
  if (!ihlClient) {
    const accounts = await getKeychainAccounts()
    const [account] = accounts.getAccounts()
    ihlClient = new SiweClient(
      {
        accountAddress: account,
        statement: SIWE_STATEMENT,
        version: SIWE_VERSION,
        chainId: parseInt(networkConfig.networkId),
        sessionDurationMs: SESSION_DURATION_MS,
        loginUrl: `${networkConfig.inHouseLiquidityURL}/auth/login`,
        clockUrl: `${networkConfig.inHouseLiquidityURL}/clock`,
        timeout:
          getDynamicConfigParams(
            DynamicConfigs[StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS]
          ).cico * 1000,
      },
      getSiweSigningFunction(accounts)
    )
  }
  return ihlClient
}
