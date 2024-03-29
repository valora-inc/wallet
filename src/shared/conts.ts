import { NetworkId } from 'src/transactions/types'

export const NETWORK_NAMES: Record<NetworkId, string> = {
  [NetworkId['celo-alfajores']]: 'Celo Alfajores',
  [NetworkId['celo-mainnet']]: 'Celo',
  [NetworkId['ethereum-mainnet']]: 'Ethereum',
  [NetworkId['ethereum-sepolia']]: 'Ethereum Sepolia',
  [NetworkId['arbitrum-one']]: 'Arbitrum One',
  [NetworkId['arbitrum-sepolia']]: 'Arbitrum Sepolia',
  [NetworkId['op-mainnet']]: 'Optimism',
  [NetworkId['op-sepolia']]: 'Optimism Sepolia',
  [NetworkId['polygon-pos-mainnet']]: 'Polygon',
  [NetworkId['polygon-pos-mumbai']]: 'Polygon Mumbai',
  [NetworkId['base-mainnet']]: 'Base',
  [NetworkId['base-sepolia']]: 'Base Sepolia',
}
