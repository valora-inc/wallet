import { ALCHEMY_ETHEREUM_API_KEY } from 'src/config'
import { Network } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createPublicClient, http, Transport } from 'viem'

export const viemTransports: Record<Network, Transport> = {
  [Network.Celo]: http(),
  [Network.Ethereum]: http(networkConfig.alchemyEthereumRpcUrl, {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ALCHEMY_ETHEREUM_API_KEY}`,
      },
    },
  }),
}

export const publicClient = {
  [Network.Celo]: createPublicClient({
    chain: networkConfig.viemChain.celo,
    transport: viemTransports[Network.Celo],
  }),
  [Network.Ethereum]: createPublicClient({
    chain: networkConfig.viemChain.ethereum,
    transport: viemTransports[Network.Ethereum],
  }),
}
