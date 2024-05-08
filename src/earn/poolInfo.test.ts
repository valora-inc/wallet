import aavePool from 'src/abis/AavePoolV3'
import { fetchAavePoolInfo } from 'src/earn/poolInfo'
import { Network } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import networkConfig from 'src/web3/networkConfig'

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  getContract: jest.fn(),
}))

describe('fetchAavePoolInfo', () => {
  it('fetches poolInfo from contract', async () => {
    jest.spyOn(publicClient[Network.Arbitrum], 'readContract').mockResolvedValue({
      currentLiquidityRate: BigInt(1e27 * 0.036),
    })

    const result = await fetchAavePoolInfo('0x1234')

    expect(result).toEqual({ apy: 0.0366558430938988 })
    expect(publicClient[Network.Arbitrum].readContract).toHaveBeenCalledWith({
      abi: aavePool,
      address: networkConfig.arbAavePoolV3ContractAddress,
      functionName: 'getReserveData',
      args: ['0x1234'],
    })
  })
})
