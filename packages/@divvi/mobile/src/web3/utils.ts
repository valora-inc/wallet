import { ENABLED_NETWORK_IDS } from 'src/config'
import { Network, NetworkId } from 'src/transactions/types'
import { networkIdToNetwork } from 'src/web3/networkConfig'

export function getNetworkFromNetworkId(networkId?: NetworkId): Network | undefined {
  return networkId ? networkIdToNetwork[networkId] : undefined
}

export function getSupportedNetworkIds(): NetworkId[] {
  return ENABLED_NETWORK_IDS as NetworkId[]
}
