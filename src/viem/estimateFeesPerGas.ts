import networkConfig from 'src/web3/networkConfig'
import { Address, Client, hexToBigInt } from 'viem'
import { estimateFeesPerGas as defaultEstimateFeesPerGas, getBlock } from 'viem/actions'

export async function estimateFeesPerGas(
  client: Client,
  feeCurrency?: Address
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; baseFeePerGas: bigint }> {
  // Custom path for Celo that can be removed once it's supported in viem
  // See https://github.com/wagmi-dev/viem/discussions/914
  if (client.chain?.id === networkConfig.viemChain.celo.id) {
    // The gasPrice returned on Celo is already roughly 2x baseFeePerGas
    // See this thread for more context:
    // https://valora-app.slack.com/archives/CNJ7KTHQU/p1697717100995909?thread_ts=1697647756.662059&cid=CNJ7KTHQU
    const [gasPrice, maxPriorityFeePerGas] = await Promise.all([
      getGasPrice(client, feeCurrency),
      getMaxPriorityFeePerGas(client, feeCurrency),
    ])
    const maxFeePerGas = gasPrice + maxPriorityFeePerGas
    // TODO: properly calculate baseFeePerGas
    return { maxFeePerGas, maxPriorityFeePerGas, baseFeePerGas: BigInt(maxFeePerGas) }
  }

  if (feeCurrency) {
    throw new Error('feeCurrency is only supported on Celo')
  }

  const block = await getBlock(client)

  return {
    ...(await defaultEstimateFeesPerGas(client, {
      // estimateFeesPerGas calls internal_estimateFeesPerGas
      // which accepts a block as an argument, but it's not exposed publicly
      // We do this so we don't fetch the latest block twice.
      // See https://github.com/wevm/viem/blob/7c479d86ad68daf2fd8874cbc6eec08d6456e540/src/actions/public/estimateFeesPerGas.ts#L91
      // @ts-expect-error
      block,
    })),
    baseFeePerGas: block.baseFeePerGas,
  }
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
