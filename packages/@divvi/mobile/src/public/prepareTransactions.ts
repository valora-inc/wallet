// See useWallet for why we don't directly import internal modules, except for the types
import type { Address, Hex } from 'viem'
import type { Store } from '../redux/store'
import type { FeeCurrenciesSelector } from '../tokens/selectors'
import type { NetworkId as InternalNetworkId } from '../transactions/types'
import type {
  TransactionRequest as InternalTransactionRequest,
  PrepareTransactions,
} from '../viem/prepareTransactions'
import type { NetworkId } from './types'

export type {
  PreparedTransactionsNeedDecreaseSpendAmountForGas,
  PreparedTransactionsNotEnoughBalanceForGas,
  PreparedTransactionsPossible,
  PreparedTransactionsResult,
} from '../viem/prepareTransactions'

export type TransactionRequest = {
  to: Address
  data?: Hex
  value?: bigint
  // These are needed when preparing more than one transaction
  gas?: bigint // in wei
  estimatedGasUse?: bigint // in wei
}

function toInternalTransactionRequest(tx: TransactionRequest): InternalTransactionRequest {
  return {
    to: tx.to,
    value: tx.value,
    data: tx.data,
    gas: tx.gas,
    _estimatedGasUse: tx.estimatedGasUse,
  }
}

function toInternalTransactionRequests(txs: TransactionRequest[]): InternalTransactionRequest[] {
  return txs.map(toInternalTransactionRequest)
}

export async function prepareTransactions({
  networkId,
  transactionRequests,
}: {
  networkId: NetworkId
  transactionRequests: TransactionRequest[]
}) {
  const store = require('../redux/store').store as Store
  const feeCurrenciesSelector = require('../tokens/selectors')
    .feeCurrenciesSelector as FeeCurrenciesSelector
  const prepareTransactions = require('../viem/prepareTransactions')
    .prepareTransactions as PrepareTransactions

  const feeCurrencies = feeCurrenciesSelector(store.getState(), networkId as InternalNetworkId)
  const result = await prepareTransactions({
    feeCurrencies,
    decreasedAmountGasFeeMultiplier: 1,
    baseTransactions: toInternalTransactionRequests(transactionRequests),
    origin: 'framework',
  })
  return result
}
