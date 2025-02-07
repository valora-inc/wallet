// See useWallet for why we don't directly import internal modules, except for the types
import type { StaticPublicClient } from '../viem'
import type { NetworkConfig, NetworkIdToNetwork } from '../web3/networkConfig'
import type { NetworkId } from './types'

// TODO: return a chain typed client
export function getPublicClient({ networkId }: { networkId: NetworkId }) {
  const publicClient = require('../viem').publicClient as StaticPublicClient
  const networkIdToNetwork = require('../web3/networkConfig')
    .networkIdToNetwork as NetworkIdToNetwork
  const networkConfig = require('../web3/networkConfig').default as NetworkConfig

  const network = networkIdToNetwork[networkId]

  // TODO: remove this check once we have a public client for all networkIds
  // This is a limitation of the current networkConfig
  if (networkConfig.networkToNetworkId[network] !== networkId) {
    throw new Error(`${networkId} can't yet be used`)
  }

  return publicClient[network]
}
