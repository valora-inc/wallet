import { Address, Client, hexToBigInt } from 'viem'

// Custom function for Celo that can be removed once it's supported in viem
// See https://github.com/wagmi-dev/viem/discussions/914
export async function estimateFeesPerGas(client: Client, feeCurrency?: Address) {
  // The gasPrice returned on Celo is already roughly 2x baseFeePerGas
  // See this interesting thread for more details:
  // https://valora-app.slack.com/archives/CNJ7KTHQU/p1697717100995909?thread_ts=1697647756.662059&cid=CNJ7KTHQU
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
