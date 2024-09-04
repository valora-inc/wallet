import { Network, NetworkId } from 'src/transactions/types'
import { networkIdToNetwork } from 'src/web3/networkConfig'

export function getNetworkFromNetworkId(networkId?: NetworkId): Network | undefined {
  return networkId ? networkIdToNetwork[networkId] : undefined
}
