import { Address } from 'viem'

export const REGISTRY_CONTRACT_ADDRESS: Address = '0x5a1a1027ac1d828e7415af7d797fba2b0cdd5575'

const supportedProtocolIds = [
  'beefy',
  'tether',
  'somm',
  'celo',
  'aerodrome',
  'velodrome',
  'vana',
  'curve',
  'farcaster',
  'mento',
  'yearn',
  'fonbnk',
  'offchainlabs',
  'euler',
  'ubeswap',
] as const

export type SupportedProtocolId = (typeof supportedProtocolIds)[number]
