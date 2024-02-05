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
}

export const NFT_EXPLORER_LINK_TRANSLATION_STRINGS: Record<NetworkId, string> = {
  [NetworkId['celo-mainnet']]: 'nftInfoCarousel.viewOnCeloExplorer', // NOTE: this is celo explorer, not celo scan!
  [NetworkId['celo-alfajores']]: 'nftInfoCarousel.viewOnCeloExplorer',
  [NetworkId['ethereum-mainnet']]: 'viewOnEthereumBlockExplorer',
  [NetworkId['ethereum-sepolia']]: 'viewOnEthereumBlockExplorer',
  [NetworkId['arbitrum-one']]: 'viewOnArbiscan',
  [NetworkId['arbitrum-sepolia']]: 'viewOnArbiscan',
  [NetworkId['op-mainnet']]: 'viewOnOPMainnetExplorer',
  [NetworkId['op-sepolia']]: 'viewOnOPSepoliaExplorer',
}

export const TX_EXPLORER_LINK_TRANSLATION_STRINGS: Record<NetworkId, string> = {
  // same as for NFTs, but uses Celo Scan for Celo
  ...NFT_EXPLORER_LINK_TRANSLATION_STRINGS,
  [NetworkId['celo-mainnet']]: 'viewOnCeloScan',
  [NetworkId['celo-alfajores']]: 'viewOnCeloScan',
}
