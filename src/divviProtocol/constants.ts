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
