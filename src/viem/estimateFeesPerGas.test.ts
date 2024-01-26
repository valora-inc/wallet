import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import networkConfig from 'src/web3/networkConfig'
import { Block } from 'viem'
import {
  estimateFeesPerGas as defaultEstimateFeesPerGas,
  getBlock,
  readContract,
} from 'viem/actions'

jest.mock('viem/actions', () => ({
  getBlock: jest.fn(),
  estimateFeesPerGas: jest.fn(),
  readContract: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe(estimateFeesPerGas, () => {
  it('should return the correct fees per gas on Celo', async () => {
    jest.mocked(readContract).mockResolvedValue(BigInt(50))
    const client = {
      chain: { id: networkConfig.viemChain.celo.id },
      request: jest.fn(async ({ method, params }) => {
        expect(params).toBeUndefined()
        if (method === 'eth_gasPrice') return '0x64' // 100 in hex
        if (method === 'eth_maxPriorityFeePerGas') return '0xa' // 10 in hex
        throw new Error(`Unknown method ${method}`)
      }),
    }
    const fees = await estimateFeesPerGas(client as any)
    expect(fees).toEqual({
      maxFeePerGas: BigInt(110),
      maxPriorityFeePerGas: BigInt(10),
      baseFeePerGas: BigInt(50),
    })
    expect(defaultEstimateFeesPerGas).not.toHaveBeenCalled()
    expect(getBlock).not.toHaveBeenCalled()
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        functionName: 'getGasPriceMinimum',
        args: [networkConfig.celoTokenAddress],
      })
    )
  })

  it('should return the correct fees per gas on Celo when fee currency is specified', async () => {
    jest.mocked(readContract).mockResolvedValue(BigInt(50))
    const client = {
      chain: { id: networkConfig.viemChain.celo.id },
      request: jest.fn(async ({ method, params }) => {
        expect(params).toEqual(['0x123'])
        if (method === 'eth_gasPrice') return '0x64' // 100 in hex
        if (method === 'eth_maxPriorityFeePerGas') return '0xa' // 10 in hex
        throw new Error(`Unknown method ${method}`)
      }),
    }
    const fees = await estimateFeesPerGas(client as any, '0x123')
    expect(fees).toEqual({
      maxFeePerGas: BigInt(110),
      maxPriorityFeePerGas: BigInt(10),
      baseFeePerGas: BigInt(50),
    })
    expect(defaultEstimateFeesPerGas).not.toHaveBeenCalled()
    expect(getBlock).not.toHaveBeenCalled()
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        functionName: 'getGasPriceMinimum',
        args: ['0x123'],
      })
    )
  })

  it('should return the default fees per gas on other networks', async () => {
    jest
      .mocked(defaultEstimateFeesPerGas)
      .mockResolvedValue({ maxFeePerGas: BigInt(110), maxPriorityFeePerGas: BigInt(10) })
    const mockBlock = { baseFeePerGas: BigInt(50) } as Block
    jest.mocked(getBlock).mockResolvedValue(mockBlock)
    const client = {
      chain: { id: 1 },
    }
    const fees = await estimateFeesPerGas(client as any)
    expect(fees).toEqual({
      maxFeePerGas: BigInt(110),
      maxPriorityFeePerGas: BigInt(10),
      baseFeePerGas: BigInt(50),
    })
    expect(defaultEstimateFeesPerGas).toHaveBeenCalledWith(client, { block: mockBlock })
    expect(defaultEstimateFeesPerGas).toHaveBeenCalledTimes(1)
    expect(getBlock).toHaveBeenCalledWith(client)
    expect(getBlock).toHaveBeenCalledTimes(1)
    expect(readContract).not.toHaveBeenCalled()
  })

  it('should throw on other networks when fee currency is specified', async () => {
    jest
      .mocked(defaultEstimateFeesPerGas)
      .mockResolvedValue({ maxFeePerGas: BigInt(110), maxPriorityFeePerGas: BigInt(10) })
    jest.mocked(getBlock).mockResolvedValue({ baseFeePerGas: BigInt(50) } as Block)
    const client = {
      chain: { id: 1 },
    }
    await expect(estimateFeesPerGas(client as any, '0x123')).rejects.toThrowError(
      'feeCurrency is only supported on Celo'
    )
    expect(defaultEstimateFeesPerGas).not.toHaveBeenCalled()
    expect(getBlock).not.toHaveBeenCalled()
    expect(readContract).not.toHaveBeenCalled()
  })
})
