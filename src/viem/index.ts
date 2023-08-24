import networkConfig, { Chains } from 'src/web3/networkConfig'
import { createPublicClient, http } from 'viem'

export const publicClient = {
  [Chains.celo]: createPublicClient({
    chain: networkConfig.viemChain.celo,
    transport: http(),
  }),
}
