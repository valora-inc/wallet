import { NetworkId } from 'src/transactions/types'

export const NETWORK_NAMES: Record<NetworkId, string> = {
  [NetworkId['celo-alfajores']]: 'Celo Alfajores',
  [NetworkId['celo-mainnet']]: 'Celo',
  [NetworkId['ethereum-mainnet']]: 'Ethereum',
  [NetworkId['ethereum-sepolia']]: 'Ethereum Sepolia',
  [NetworkId['arbitrum-one']]: 'Arbitrum One',
  [NetworkId['arbitrum-sepolia']]: 'Arbitrum Sepolia',
}
