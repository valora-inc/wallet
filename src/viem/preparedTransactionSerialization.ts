// Helper functions making prepared transactions serializable
// so they can be used in redux actions (or even stores).
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'

const bigIntProps = ['value', 'gas', 'maxFeePerGas', 'maxPriorityFeePerGas', 'gatewayFee'] as const

type BigIntProps = (typeof bigIntProps)[number]

type MapBigIntToString<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? string : T[P]
}

function mapBigIntsToStrings<T, K extends keyof T>(
  obj: T,
  bigIntKeys: readonly K[]
): MapBigIntToString<T, K> {
  const result = { ...obj } as MapBigIntToString<T, K>

  for (const key of bigIntKeys) {
    const value = obj[key]
    if (typeof value === 'bigint') {
      result[key] = value.toString() as any
    }
  }

  return result
}

export type SerializableTransactionRequestCIP42 = MapBigIntToString<
  TransactionRequestCIP42,
  BigIntProps
>

export function getSerializablePreparedTransaction(
  preparedTransaction: TransactionRequestCIP42
): SerializableTransactionRequestCIP42 {
  return mapBigIntsToStrings(preparedTransaction, bigIntProps)
}

export function getSerializablePreparedTransactions(
  preparedTransactions: TransactionRequestCIP42[]
): SerializableTransactionRequestCIP42[] {
  return preparedTransactions.map(getSerializablePreparedTransaction)
}

export function getPreparedTransaction(
  preparedTransaction: SerializableTransactionRequestCIP42
): TransactionRequestCIP42 {
  const result: TransactionRequestCIP42 = { ...preparedTransaction } as TransactionRequestCIP42

  for (const prop of bigIntProps) {
    const value = preparedTransaction[prop]
    if (value) {
      result[prop] = BigInt(value)
    }
  }

  return result
}

export function getPreparedTransactions(
  preparedTransactions: SerializableTransactionRequestCIP42[]
): TransactionRequestCIP42[] {
  return preparedTransactions.map(getPreparedTransaction)
}
