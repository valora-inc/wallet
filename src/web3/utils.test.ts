import { Network, NetworkId } from 'src/transactions/types'
import { getNetworkFromNetworkId } from 'src/web3/utils'

describe('web3 utils', () => {
  describe('getNetworkFromNetworkId', () => {
    it('spot checks for celo and ethereum', () => {
      // testing every case would be circular
      expect(getNetworkFromNetworkId(NetworkId['celo-mainnet'])).toEqual(Network.Celo)
      expect(getNetworkFromNetworkId(NetworkId['ethereum-mainnet'])).toEqual(Network.Ethereum)
    })
  })
})
