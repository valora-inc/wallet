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
  mode: EarnDepositMode
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
}

export enum BeforeDepositActionName {
  Add = 'Add',
  Transfer = 'Transfer',
  SwapAndDeposit = 'SwapAndDeposit',
  CrossChainSwap = 'CrossChainSwap',
  Swap = 'Swap',
}

export interface BeforeDepositAction {
  name: BeforeDepositActionName
  title: string
  details: string
  iconComponent: React.MemoExoticComponent<({ color }: { color: Colors }) => JSX.Element>
  onPress: () => void
}

export type EarnDepositMode = 'deposit' | 'swap-deposit'
