import { Address } from 'viem'

export const REGISTRY_CONTRACT_ADDRESS: Address = '0xba9655677f4e42dd289f5b7888170bc0c7da8cdc'

export const supportedProtocolIds = [
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
