import aavePool from 'src/abis/AavePoolV3'
import { fetchAavePoolInfo, fetchAaveRewards } from 'src/earn/poolInfo'
import { Network, NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import networkConfig from 'src/web3/networkConfig'
import { mockArbArbTokenBalance } from 'test/values'

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

describe('fetchAaveRewards', () => {
  const mockRewards = [
    ['0x912CE59144191C1204E64559FE8253a0e49E6548', '0xba5ddd1f9d7f570dc94a51479a000e3bce967196'], // ARB and AAVE
    [BigInt('2297012079410746'), BigInt('2297012079490746')],
  ]
  const warnSpy = jest.spyOn(Logger, 'warn')

  it('fetches rewards from contract', async () => {
    jest.spyOn(publicClient[Network.Arbitrum], 'readContract').mockResolvedValue(mockRewards)
    const result = await fetchAaveRewards({
      walletAddress: '0x1234',
      assetAddress: '0x1234',
      contractAddress: networkConfig.arbAaveIncentivesV3ContractAddress,
      networkId: NetworkId['arbitrum-sepolia'],
      allTokens: [mockArbArbTokenBalance],
    })
    // should get arb, but not aave because we don't have tokenInfo for it.
    expect(result).toEqual([
      {
        amount: '0.002297012079410746',
        tokenInfo: mockArbArbTokenBalance,
      },
    ])

    // should warn that aave wasn't able to be shown
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})
