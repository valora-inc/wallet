import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'

describe(estimateFeesPerGas, () => {
  it('should return the correct fees per gas', async () => {
    const client = {
      request: jest.fn(async ({ method, params }) => {
        expect(params).toBeUndefined()
        if (method === 'eth_gasPrice') return '0x64' // 100 in hex
        throw new Error(`Unknown method ${method}`)
      }),
    }
    const fees = await estimateFeesPerGas(client as any)
    expect(fees).toEqual({ maxFeePerGas: BigInt(100), maxPriorityFeePerGas: undefined })
  })

  it('when fee currency is specified, it should return the correct fees per gas', async () => {
    const client = {
      request: jest.fn(async ({ method, params }) => {
        expect(params).toEqual(['0x123'])
        if (method === 'eth_gasPrice') return '0x64' // 100 in hex
        throw new Error(`Unknown method ${method}`)
      }),
    }
    const fees = await estimateFeesPerGas(client as any, '0x123')
    expect(fees).toEqual({ maxFeePerGas: BigInt(100), maxPriorityFeePerGas: undefined })
  })
})
