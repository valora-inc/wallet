import { tokensByIdSelector } from 'src/tokens/selectors'
import { BaseStandbyTransaction, addStandbyTransaction } from 'src/transactions/actions'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getFeeCurrencyToken } from 'src/viem/prepareTransactions'
import {
  SerializableTransactionRequest,
  getPreparedTransactions,
} from 'src/viem/preparedTransactionSerialization'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { getNetworkFromNetworkId } from 'src/web3/utils'
import { call, put, select } from 'typed-redux-saga'
import { Hash } from 'viem'
import { getTransactionCount } from 'viem/actions'

const TAG = 'viem/saga'

/**
 * Sends prepared transactions and adds standby transactions to the store.
 * Returns the hashes of the sent transactions. Throws if the transactions fail
 * to be sent to the network.
 * @param {string} serializablePreparedTransactions - serialized prepared
 * transactions
 * @param {number} networkId - network id of the network the transactions are
 * being sent on
 * @param {number} createBaseStandbyTransactions - functions that create the
 * standby transactions, each element corresponding to the prepared transaction
 * of the matching index
 * @param {boolean} isGasSubsidized - an optional boolean that indicates whether
 * gas is subsidized for the transaction, which means a valora rpc node will be
 * used instead of the default alchemy rpc node
 */
export function* sendPreparedTransactions(
  serializablePreparedTransactions: SerializableTransactionRequest[],
  networkId: NetworkId,
  createBaseStandbyTransactions: ((
    transactionHash: string,
    feeCurrencyId?: string
  ) => BaseStandbyTransaction)[],
  isGasSubsidized: boolean = false
) {
  if (serializablePreparedTransactions.length !== createBaseStandbyTransactions.length) {
    throw new Error('Mismatch in number of prepared transactions and standby transaction creators')
  }

  const network = getNetworkFromNetworkId(networkId)
  if (!network) {
    throw new Error(`No matching network found for network id: ${networkId}`)
  }

  const wallet = yield* call(getViemWallet, networkConfig.viemChain[network], isGasSubsidized)
  if (!wallet.account) {
    // this should never happen
    throw new Error('No account found in the wallet')
  }

  // Unlock account before executing tx
  yield* call(getConnectedUnlockedAccount)

  // @ts-ignore typed-redux-saga erases the parameterized types causing error, we can address this separately
  let nonce: number = yield* call(getTransactionCount, wallet, {
    address: wallet.account.address,
    blockTag: 'pending',
  })

  const preparedTransactions = getPreparedTransactions(serializablePreparedTransactions)
  const txHashes: Hash[] = []
  for (let i = 0; i < preparedTransactions.length; i++) {
    const preparedTransaction = preparedTransactions[i]
    const createBaseStandbyTransaction = createBaseStandbyTransactions[i]

    const signedTx = yield* call([wallet, 'signTransaction'], {
      ...preparedTransaction,
      nonce: nonce++,
    } as any)
    const hash = yield* call([wallet, 'sendRawTransaction'], {
      serializedTransaction: signedTx,
    })

    Logger.debug(
      `${TAG}/sendTransactionsSaga`,
      'Successfully sent transaction to the network',
      hash
    )

    const tokensById = yield* select((state) => tokensByIdSelector(state, [networkId]))
    const feeCurrencyId = getFeeCurrencyToken([preparedTransaction], networkId, tokensById)?.tokenId

    yield* put(addStandbyTransaction(createBaseStandbyTransaction(hash, feeCurrencyId)))
    txHashes.push(hash)
  }

  return txHashes
}
