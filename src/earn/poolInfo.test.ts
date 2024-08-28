import aavePool from 'src/abis/AavePoolV3'
import { fetchAavePoolInfo } from 'src/earn/poolInfo'
import { Network } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import networkConfig from 'src/web3/networkConfig'

describe('poolInfo', () => {
  it('fetches poolInfo from contract', async () => {
    jest.spyOn(publicClient[Network.Arbitrum], 'readContract').mockResolvedValue({
      currentLiquidityRate: BigInt(1e27 * 0.036),
    })

    const result = await fetchAavePoolInfo({
      assetAddress: '0x1234',
      contractAddress: networkConfig.arbAavePoolV3ContractAddress,
      network: Network.Arbitrum,
    })

    expect(result).toEqual({ apy: 0.0366558430938988 })
    expect(publicClient[Network.Arbitrum].readContract).toHaveBeenCalledWith({
      abi: aavePool,
      address: networkConfig.arbAavePoolV3ContractAddress,
      functionName: 'getReserveData',
      args: ['0x1234'],
    })
  })
})
