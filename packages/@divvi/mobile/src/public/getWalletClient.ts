// See useWallet for why we don't directly import internal modules, except for the types
import { call } from 'typed-redux-saga'
import type { RunSaga } from '../redux/store'
import type { GetViemWallet } from '../web3/contracts'
import type { NetworkConfig, NetworkIdToNetwork } from '../web3/networkConfig'
import type { NetworkId } from './types'

// TODO: return a chain typed client
export async function getWalletClient({ networkId }: { networkId: NetworkId }) {
  const runSaga = require('../redux/store').runSaga as RunSaga
  const getViemWallet = require('../web3/contracts').getViemWallet as GetViemWallet
  const networkIdToNetwork = require('../web3/networkConfig')
    .networkIdToNetwork as NetworkIdToNetwork
  const networkConfig = require('../web3/networkConfig').default as NetworkConfig

  const network = networkIdToNetwork[networkId]

  // TODO: remove this check once we have a wallet client for all networkIds
  // This is a limitation of the current networkConfig
  if (networkConfig.networkToNetworkId[network] !== networkId) {
    throw new Error(`${networkId} can't yet be used`)
  }

  const result = await runSaga(function* () {
    return yield* call(getViemWallet, networkConfig.viemChain[network])
  })

  return result
}
