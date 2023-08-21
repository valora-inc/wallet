export enum BlockchainId { // id to use when using Valora API's
  'celo-mainnet' = 'celo-mainnet',
  'celo-alfajores' = 'celo-alfajores',
  'ethereum-mainnet' = 'ethereum-mainnet',
  'ethereum-goerli' = 'ethereum-goerli',
  'polygon-mainnet' = 'polygon-mainnet',
  'polygon-mumbai' = 'polygon-mumbai',
}

export enum BlockchainName {
  Celo = 'Celo',
  Ethereum = 'Ethereum',
  Polygon = 'polygon',
}

export const BlockchainNameToIdMainnet: Record<BlockchainName, BlockchainId> = {
  [BlockchainName.Celo]: BlockchainId['celo-mainnet'],
  [BlockchainName.Ethereum]: BlockchainId['ethereum-mainnet'],
  [BlockchainName.Polygon]: BlockchainId['polygon-mainnet'],
}

export const BlockchainNameToIdTestnet: Record<BlockchainName, BlockchainId> = {
  [BlockchainName.Celo]: BlockchainId['celo-alfajores'],
  [BlockchainName.Ethereum]: BlockchainId['ethereum-goerli'],
  [BlockchainName.Polygon]: BlockchainId['polygon-mumbai'],
}
