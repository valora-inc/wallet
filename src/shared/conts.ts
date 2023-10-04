import { NetworkId } from 'src/transactions/types'

export const NETWORK_NAMES: Record<NetworkId, string> = {
  [NetworkId['celo-alfajores']]: 'Celo Alfajores',
  ['celo-mainnet']: 'Celo',
  ['ethereum-mainnet']: 'Ethereum',
  ['ethereum-sepolia']: 'Ethereum Sepolia',
}
