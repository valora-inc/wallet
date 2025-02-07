import { call } from 'typed-redux-saga'
import type { RunSaga } from '../redux/store'
import type { GetSerializablePreparedTransactions } from '../viem/preparedTransactionSerialization'
import type { SendPreparedTransactions } from '../viem/saga'
import type { PreparedTransactionsPossible } from './prepareTransactions'

export async function sendTransactions(prepared: PreparedTransactionsPossible) {
  const runSaga = require('../redux/store').runSaga as RunSaga
  const getSerializablePreparedTransactions = require('../viem/preparedTransactionSerialization')
    .getSerializablePreparedTransactions as GetSerializablePreparedTransactions
  const sendPreparedTransactions = require('../viem/saga')
    .sendPreparedTransactions as SendPreparedTransactions

  const result = await runSaga(function* () {
    const txHashes = yield* call(
      sendPreparedTransactions,
      getSerializablePreparedTransactions(prepared.transactions),
      prepared.feeCurrency.networkId,
      prepared.transactions.map(() => () => null)
    )
    return txHashes
  })

  return result
}
