import { Address, Client, hexToBigInt } from 'viem'

// Custom function that can be removed once it's supported in viem
// See https://github.com/wagmi-dev/viem/discussions/914
export async function estimateFeesPerGas(client: Client, feeCurrency?: Address) {
  const [gasPrice, maxPriorityFeePerGas] = await Promise.all([
    getGasPrice(client, feeCurrency),
    getMaxPriorityFeePerGas(client, feeCurrency),
  ])
  const maxFeePerGas = gasPrice + maxPriorityFeePerGas
  return { maxFeePerGas, maxPriorityFeePerGas }
}

// Get gas price with optional fee currency, this is Celo specific
// See https://docs.celo.org/developer/viem#gas-price
export async function getGasPrice(client: Client, feeCurrency: Address | undefined) {
  const priceHex = await client.request({
    method: 'eth_gasPrice',
    ...((feeCurrency ? { params: [feeCurrency] } : {}) as object),
  })
  return hexToBigInt(priceHex)
}

// Get max priority fee per gas with optional fee currency, this is Celo specific
export async function getMaxPriorityFeePerGas(client: Client, feeCurrency?: Address) {
  const maxPriorityFeePerGasHex = await client.request({
    method: 'eth_maxPriorityFeePerGas',
    ...((feeCurrency ? { params: [feeCurrency] } : {}) as object),
  })
  return hexToBigInt(maxPriorityFeePerGasHex)
}
