import { NetworkId } from 'src/transactions/types'

// Decimal number serialized as a string
export type SerializedDecimalNumber = string

export interface PositionDisplayProps {
  title: string
  description: string
  imageUrl: string
}

export type TokenCategory = 'claimable'

export interface AbstractPosition {
  address: string // Example: 0x...
  networkId: NetworkId // Example: celo-mainnet
  appId: string // Example: ubeswap
  appName: string
  tokens: Token[]
  displayProps: PositionDisplayProps
  availableShortcutIds: string[]
}

// There's an opportunity to combine with the types in src/tokens/slice.ts
// For now, we'll keep them separate
export interface AbstractToken {
  address: string // Example: 0x...
  networkId: NetworkId // Example: celo-mainnet
  symbol: string // Example: cUSD
  decimals: number // Example: 18
  priceUsd: SerializedDecimalNumber // Example: "1.5"
  balance: SerializedDecimalNumber // Example: "200", would be negative for debt
  category?: TokenCategory
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
  category?: 'claim'
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
