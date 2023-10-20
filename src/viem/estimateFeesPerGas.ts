import { Address, Client, hexToBigInt } from 'viem'

// Custom function for Celo that can be removed once it's supported in viem
// See https://github.com/wagmi-dev/viem/discussions/914
export async function estimateFeesPerGas(client: Client, feeCurrency?: Address) {
  // The gasPrice returned on Celo is already roughly 2x baseFeePerGas
  // so we can just use that as maxFeePerGas, no need for an explicit maxPriorityFeePerGas
  // See this interesting thread for more details:
  // https://valora-app.slack.com/archives/CNJ7KTHQU/p1697717100995909?thread_ts=1697647756.662059&cid=CNJ7KTHQU
  const gasPrice = await getGasPrice(client, feeCurrency)
  const maxFeePerGas = gasPrice
  // Here we still return maxPriorityFeePerGas as undefined to be consistent with viem
  // and so consumer TXs are correctly serialized as CIP-42 TXs
  // See https://github.com/wagmi-dev/viem/blob/5c95fafceffe7f399b5b5ee32119e2d78a0c8acd/src/chains/celo/serializers.ts#L105-L106
  return { maxFeePerGas, maxPriorityFeePerGas: undefined }
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
