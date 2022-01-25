import { getGasPrice } from 'src/web3/gas'

describe('getGasPrice', () => {
  it('refreshes the gas price correctly', async () => {
    const gasPrice = await getGasPrice(undefined)
    expect(gasPrice.toNumber()).toBe(50000)
  })
})
