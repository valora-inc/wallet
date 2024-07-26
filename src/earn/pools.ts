import { Pool } from 'src/earn/types'
import { NetworkId } from 'src/transactions/types'

// TODO (ACT-1268): Replace with getEarnPositions
const pools: Pool[] = [
  {
    poolId: 'aArbUSDCn',
    networkId: NetworkId['arbitrum-one'],
    tokens: [`${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`],
    depositTokenId: `${NetworkId['arbitrum-one']}:0xaf88d065e77c8cc2239327c5edb3a432268e5831`,
    poolTokenId: `${NetworkId['arbitrum-one']}:0x724dc807b04555b71ed48a6896b6f41593b8c637`,
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    apy: 0.0555,
    reward: 0,
    tvl: 349_940_000,
    provider: 'Aave',
  },
]

export function getPools() {
  return pools
}
