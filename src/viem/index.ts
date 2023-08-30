import networkConfig, { Network } from 'src/web3/networkConfig'
import { createPublicClient, http } from 'viem'

export const publicClient = {
  [Network.celo]: createPublicClient({
    chain: networkConfig.viemChain.celo,
    transport: http(),
  }),
}
