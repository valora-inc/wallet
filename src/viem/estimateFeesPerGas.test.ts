import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import networkConfig from 'src/web3/networkConfig'
import { estimateFeesPerGas as defaultEstimateFeesPerGas } from 'viem/actions'

jest.mock('viem/actions', () => ({
  estimateFeesPerGas: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe(estimateFeesPerGas, () => {
  it('should return the correct fees per gas on Celo', async () => {
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
    expect(fees).toEqual({ maxFeePerGas: BigInt(110), maxPriorityFeePerGas: BigInt(10) })
    expect(defaultEstimateFeesPerGas).not.toHaveBeenCalled()
  })

  it('should return the correct fees per gas on Celo when fee currency is specified', async () => {
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
    expect(fees).toEqual({ maxFeePerGas: BigInt(110), maxPriorityFeePerGas: BigInt(10) })
    expect(defaultEstimateFeesPerGas).not.toHaveBeenCalled()
  })

  it('should return the default fees per gas on other networks', async () => {
    jest
      .mocked(defaultEstimateFeesPerGas)
      .mockResolvedValue({ maxFeePerGas: BigInt(110), maxPriorityFeePerGas: BigInt(10) })
    const client = {
      chain: { id: 1 },
    }
    const fees = await estimateFeesPerGas(client as any)
    expect(fees).toEqual({ maxFeePerGas: BigInt(110), maxPriorityFeePerGas: BigInt(10) })
    expect(defaultEstimateFeesPerGas).toHaveBeenCalledWith(client)
  })

  it('should return the default fees per gas on other networks when fee currency is specified', async () => {
    jest
      .mocked(defaultEstimateFeesPerGas)
      .mockResolvedValue({ maxFeePerGas: BigInt(110), maxPriorityFeePerGas: BigInt(10) })
    const client = {
      chain: { id: 1 },
    }
    const fees = await estimateFeesPerGas(client as any, '0x123')
    expect(fees).toEqual({ maxFeePerGas: BigInt(110), maxPriorityFeePerGas: BigInt(10) })
    expect(defaultEstimateFeesPerGas).toHaveBeenCalledWith(client)
  })
})
