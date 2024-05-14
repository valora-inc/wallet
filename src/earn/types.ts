import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

export interface DepositInfo {
  amount: string
  tokenId: string
  preparedTransactions: SerializableTransactionRequest[]
}
