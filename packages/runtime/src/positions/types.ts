import { NetworkId } from 'src/transactions/types'

// Decimal number serialized as a string
export type SerializedDecimalNumber = string

export interface PositionDisplayProps {
  title: string
  description: string
  imageUrl: string
  manageUrl?: string
}

type DataProps = EarnDataProps

interface YieldRate {
  percentage: number
  label: string
  tokenId: string
}

export interface EarningItem {
  amount: SerializedDecimalNumber
  label: string
  tokenId: string
  includedInPoolBalance?: boolean
}

type ClaimType = 'rewards' | 'earnings'

export interface SafetyRisk {
  isPositive: boolean
  title: string
  category: string
}

export interface Safety {
  level: 'low' | 'medium' | 'high'
  risks: SafetyRisk[]
}

interface EarnDataProps {
  contractCreatedAt?: string // ISO string
  manageUrl?: string
  termsUrl?: string
  cantSeparateCompoundedInterest?: boolean
  tvl?: SerializedDecimalNumber
  yieldRates: YieldRate[]
  earningItems: EarningItem[]
  depositTokenId: string
  withdrawTokenId: string
  rewardsPositionIds?: string[]
  claimType?: ClaimType
  withdrawalIncludesClaim?: boolean
  dailyYieldRatePercentage?: number
  safety?: Safety
  // We'll add more fields here as needed
}

export type EarnPosition = AppTokenPosition & { dataProps: EarnDataProps }

export type TokenCategory = 'claimable'

export interface AbstractPosition {
  // Should be unique across all positions
  // And treated as an opaque identifier by consumers
  positionId: string // Example: celo-mainnet:0x...
  address: string // Example: 0x...
  networkId: NetworkId // Example: celo-mainnet
  appId: string // Example: ubeswap
  appName: string
  tokens: Token[]
  displayProps: PositionDisplayProps
  dataProps?: DataProps
  availableShortcutIds: string[]
  shortcutTriggerArgs?: Record<string, any>
}

// There's an opportunity to combine with the types in src/tokens/slice.ts
// For now, we'll keep them separate
export interface AbstractToken {
  tokenId: string // Example: celo-mainnet:0x123...
  address: string // Example: 0x...
  networkId: NetworkId // Example: celo-mainnet
  symbol: string // Example: cUSD
  decimals: number // Example: 18
  priceUsd: SerializedDecimalNumber // Example: "1.5"
  balance: SerializedDecimalNumber // Example: "200", would be negative for debt
  category?: TokenCategory
  imageUrl?: string
  networkIconUrl?: string
}

export interface BaseToken extends AbstractToken {
  type: 'base-token'
}

export interface AppTokenPosition extends AbstractPosition, AbstractToken {
  type: 'app-token'
  supply: SerializedDecimalNumber // Example: "1000"
  // Price ratio between the token and underlying token(s)
  pricePerShare: SerializedDecimalNumber[]
}

export interface ContractPosition extends AbstractPosition {
  type: 'contract-position'
  // This would be derived from the underlying tokens
  balanceUsd: SerializedDecimalNumber
}

export type Token = BaseToken | AppTokenPosition
export type Position = AppTokenPosition | ContractPosition

export interface Shortcut {
  id: string
  appId: string
  name: string
  description: string
  networkIds: NetworkId[]
  category?: 'claim' | 'deposit' | 'withdraw'
}

export type ShortcutStatus =
  | 'idle'
  | 'loading'
  | 'pendingAccept'
  | 'accepting'
  | 'success'
  | 'error'

export type ClaimableShortcut = Shortcut & {
  claimableTokens: Token[]
}

export interface ClaimablePosition extends Omit<Position, 'availableShortcutIds' | 'tokens'> {
  claimableShortcut: ClaimableShortcut
  status: ShortcutStatus
}
