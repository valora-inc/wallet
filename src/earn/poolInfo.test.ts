import aavePool from 'src/abis/AavePoolV3'
import { fetchAavePoolInfo, fetchAavePoolUserBalance } from 'src/earn/poolInfo'
import { Network } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import networkConfig from 'src/web3/networkConfig'
import { getContract } from 'viem'

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

describe('fetchAavePoolUserBalance', () => {
  it('fetches user balance from contract', async () => {
    const mockReadContract = jest
      .spyOn(publicClient[Network.Arbitrum], 'readContract')
      .mockResolvedValue({
        aTokenAddress: '0xaToken',
      })
    const mockContractInstance = {
      read: {
        balanceOf: jest.fn().mockResolvedValue(BigInt(10750000)),
        decimals: jest.fn().mockResolvedValue(6),
      },
    }

    // @ts-ignore
    jest.mocked(getContract).mockReturnValue(mockContractInstance)

    const result = await fetchAavePoolUserBalance({
      assetAddress: '0x1234',
      walletAddress: '0x5678',
    })

    expect(mockReadContract).toHaveBeenCalledWith({
      abi: aavePool,
      address: networkConfig.arbAavePoolV3ContractAddress,
      functionName: 'getReserveData',
      args: ['0x1234'],
    })

    expect(mockContractInstance.read.balanceOf).toHaveBeenCalledWith(['0x5678'])
    expect(mockContractInstance.read.decimals).toHaveBeenCalled()
    expect(result).toEqual({ balanceInDecimal: '10.75' })
  })
})
