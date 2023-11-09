import { TransactionRequest } from 'src/viem/prepareTransactions'
import { Address } from 'viem'

export function getFeeCurrency(preparedTransactions: TransactionRequest[]): Address | undefined
export function getFeeCurrency(preparedTransaction: TransactionRequest): Address | undefined
export function getFeeCurrency(x: TransactionRequest[] | TransactionRequest): Address | undefined {
  let preparedTransaction: TransactionRequest
  if (Array.isArray(x)) {
    // The prepared transactions always use the same fee currency
    preparedTransaction = x[0]
  } else {
    preparedTransaction = x
  }

  if ('feeCurrency' in preparedTransaction) {
    return preparedTransaction.feeCurrency
  }

  return undefined
}
