import { NetworkId } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Hash } from 'viem'

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

export enum EarnTabType {
  AllPools = 0,
  MyPools = 1,
}

export interface PoolInfo {
  apy: number
}
