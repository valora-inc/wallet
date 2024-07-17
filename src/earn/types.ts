import { TokenBalance } from 'src/tokens/slice'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { NetworkId } from 'src/transactions/types'
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

export interface PoolInfo {
  apy: number
}
