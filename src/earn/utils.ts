import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { Network, NetworkId } from 'src/transactions/types'
import { INTERNAL_RPC_SUPPORTED_NETWORKS } from 'src/viem'
import { networkIdToNetwork } from 'src/web3/networkConfig'

/**
 * Helper function to check if gas is subsidized for the given networkId
 * @param networkId - networkId to check
 * @returns boolean
 */
export function isGasSubsidizedForNetwork(networkId: NetworkId) {
  return (
    (INTERNAL_RPC_SUPPORTED_NETWORKS as readonly Network[]).includes(
      networkIdToNetwork[networkId]
    ) && getFeatureGate(StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES)
  )
}
