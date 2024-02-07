import {
  walletConnectChainIdToNetwork,
  walletConnectChainIdToNetworkId,
} from 'src/web3/networkConfig'
import { NetworkId, Network } from 'src/transactions/types'

describe('networkConfig', () => {
  it('walletConnectChainIdToNetworkId spot checks', () => {
    // not attempting to check every value (too circular). just making sure inversion of networkIdToWalletConnectChainId is working as expected
    expect(walletConnectChainIdToNetworkId['eip155:42220']).toEqual(NetworkId['celo-mainnet'])
    expect(walletConnectChainIdToNetworkId['eip155:1']).toEqual(NetworkId['ethereum-mainnet'])
  })
  it('walletConnectChainIdToNetwork spot checks', () => {
    // not checking every value (too circular), just testing the logic used to populate this object
    expect(walletConnectChainIdToNetwork['eip155:42220']).toEqual(Network.Celo)
    expect(walletConnectChainIdToNetwork['eip155:1']).toEqual(Network.Ethereum)
  })
})
