import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Address, Hash } from 'viem'

export interface DepositInfo {
  amount: string
  tokenId: string
  preparedTransactions: SerializableTransactionRequest[]
}

export interface DepositSuccess {
  tokenId: string
  transactionHash: Hash
  networkId: NetworkId
}

export interface RewardsInfo {
  amount: string
  tokenInfo: TokenBalance
}

export interface SerializableRewardsInfo {
  amount: string
  tokenId: string
}

export interface WithdrawInfo {
  amount: string
  tokenId: string
  preparedTransactions: SerializableTransactionRequest[]
  rewards: SerializableRewardsInfo[]
}

export interface Pool {
  poolId: string
  providerId: string
  networkId: NetworkId
  tokens: string[]
  depositTokenId: string
  poolTokenId: string
  poolAddress: Address
  apy: number
  reward: number
  tvl: number
  provider: string
}

export enum EarnTabType {
  OpenPools = 0,
  MyPools = 1,
}

export interface PoolInfo {
  apy: number
}
