// Helper functions making prepared transactions serializable
// so they can be used in redux actions (or even stores).
import { TransactionRequest } from 'src/viem/prepareTransactions'

const bigIntProps = [
  'value',
  'gas',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
  '_estimatedGasUse',
  '_baseFeePerGas',
] as const

export type BigIntProps = (typeof bigIntProps)[number]

export type MapValuesToString<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? string : T[P]
}

function mapBigIntsToStrings<T extends object, K extends keyof T>(
  obj: T,
  bigIntKeys: readonly K[]
): MapValuesToString<T, K> {
  const result = { ...obj } as MapValuesToString<T, K>

  for (const key of bigIntKeys) {
    const value = obj[key]
    if (typeof value === 'bigint') {
      result[key] = value.toString() as MapValuesToString<T, K>[K]
    }
  }

  return result
}

export type SerializableTransactionRequest = MapValuesToString<TransactionRequest, BigIntProps>

export function getSerializablePreparedTransaction(
  preparedTransaction: TransactionRequest
): SerializableTransactionRequest {
  return mapBigIntsToStrings(preparedTransaction, bigIntProps)
}

export function getSerializablePreparedTransactions(
  preparedTransactions: TransactionRequest[]
): SerializableTransactionRequest[] {
  return preparedTransactions.map(getSerializablePreparedTransaction)
}

export function getPreparedTransaction(
  preparedTransaction: SerializableTransactionRequest
): TransactionRequest {
  const result: TransactionRequest = { ...preparedTransaction } as TransactionRequest

  for (const prop of bigIntProps) {
    const value = preparedTransaction[prop]
    if (value) {
      result[prop] = BigInt(value)
    }
  }

  return result
}

export function getPreparedTransactions(
  preparedTransactions: SerializableTransactionRequest[]
): TransactionRequest[] {
  return preparedTransactions.map(getPreparedTransaction)
}
