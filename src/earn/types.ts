import { EarnPosition, Position, Token } from 'src/positions/types'
import Colors from 'src/styles/colors'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Address, Hash } from 'viem'

export interface DepositInfo {
  amount: string
  preparedTransactions: SerializableTransactionRequest[]
  pool: EarnPosition
  mode: EarnActiveMode
  fromTokenId: string
  fromTokenAmount: string
}

export interface DepositSuccess {
  tokenId: string
  transactionHash: Hash
  networkId: NetworkId
}

export interface SerializableRewardsInfo {
  amount: string
  tokenId: string
}

export interface WithdrawInfo {
  amount?: string
  pool: EarnPosition
  preparedTransactions: SerializableTransactionRequest[]
  rewardsTokens: Token[]
}

export enum EarnTabType {
  AllPools = 0,
  MyPools = 1,
}

export interface PoolInfo {
  apy: number
}

export interface PrepareWithdrawAndClaimParams {
  pool: EarnPosition
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  hooksApiUrl: string
  rewardsPositions: Position[]
  amount?: string
  useMax?: boolean
}

export type BeforeDepositActionName =
  | 'Add'
  | 'Transfer'
  | 'SwapAndDeposit'
  | 'CrossChainSwap'
  | 'Swap'

export interface BeforeDepositAction {
  name: BeforeDepositActionName
  title: string
  details: string
  iconComponent: React.MemoExoticComponent<({ color }: { color: Colors }) => JSX.Element>
  onPress: () => void
}

export interface WithdrawAction {
  name: EarnActiveMode
  title: string
  details: string
  iconComponent: React.MemoExoticComponent<({ color }: { color: Colors }) => JSX.Element>
  onPress: () => void
}

export type EarnActiveMode = 'withdraw' | 'claim-rewards' | 'deposit' | 'swap-deposit' | 'exit'
