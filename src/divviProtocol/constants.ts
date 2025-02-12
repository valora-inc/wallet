import { Address, keccak256, stringToHex } from 'viem'

export const REGISTRY_CONTRACT_ADDRESS: Address = '0x5a1a1027ac1d828e7415af7d797fba2b0cdd5575'

export const supportedProtocolIdHashes: Record<string, string> = {
  [keccak256(stringToHex('beefy'))]: 'beefy',
  [keccak256(stringToHex('tether'))]: 'tether',
  [keccak256(stringToHex('somm'))]: 'somm',
  [keccak256(stringToHex('celo'))]: 'celo',
  [keccak256(stringToHex('aerodrome'))]: 'aerodrome',
  [keccak256(stringToHex('velodrome'))]: 'velodrome',
  [keccak256(stringToHex('vana'))]: 'vana',
  [keccak256(stringToHex('curve'))]: 'curve',
  [keccak256(stringToHex('farcaster'))]: 'farcaster',
  [keccak256(stringToHex('mento'))]: 'mento',
  [keccak256(stringToHex('yearn'))]: 'yearn',
  [keccak256(stringToHex('fonbnk'))]: 'fonbnk',
  [keccak256(stringToHex('offchainlabs'))]: 'offchainlabs',
  [keccak256(stringToHex('euler'))]: 'euler',
  [keccak256(stringToHex('ubeswap'))]: 'ubeswap',
} as const

export type SupportedProtocolIds =
  (typeof supportedProtocolIdHashes)[keyof typeof supportedProtocolIdHashes]
