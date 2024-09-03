import { ClaimablePosition, EarnPosition, Token } from 'src/positions/types'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Address, Hash } from 'viem'

export interface DepositInfo {
  amount: string
  preparedTransactions: SerializableTransactionRequest[]
  pool: EarnPosition
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
  positionsWithClaimableRewards: ClaimablePosition[]
}
