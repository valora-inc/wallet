import { Network } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createPublicClient, http } from 'viem'
import { celo, celoAlfajores } from 'viem/chains'

export const publicClient = {
  [Network.Celo]: createPublicClient({
    chain: networkConfig.viemChain.celo as typeof celo | typeof celoAlfajores, // this type allows us to use feeCurrency on publicClient methods
    transport: http(),
  }),
}
