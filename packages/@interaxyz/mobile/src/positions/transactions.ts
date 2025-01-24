import { RawShortcutTransaction } from 'src/positions/slice'
import { TransactionRequest } from 'src/viem/prepareTransactions'

function rawShortcutTransactionToTransactionRequest(
  rawTx: RawShortcutTransaction
): TransactionRequest {
  return {
    from: rawTx.from,
    to: rawTx.to,
    value: rawTx.value ? BigInt(rawTx.value) : undefined,
    data: rawTx.data,
    gas: rawTx.gas ? BigInt(rawTx.gas) : undefined,
    _estimatedGasUse: rawTx.estimatedGasUse ? BigInt(rawTx.estimatedGasUse) : undefined,
  }
}

export function rawShortcutTransactionsToTransactionRequests(
  rawTxs: RawShortcutTransaction[]
): TransactionRequest[] {
  return rawTxs.map(rawShortcutTransactionToTransactionRequest)
}
