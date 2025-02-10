import { registrationCompleted } from 'src/app/actions'
import { registrationsSelector } from 'src/app/selectors'
import { APP_REGISTRY_NAME, CONNECTED_PROTOCOL_IDS } from 'src/config'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS, supportedProtocolIdHashes } from 'src/divviProtocol/constants'
import { store } from 'src/redux/store'
import { Network, NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import { call, put } from 'typed-redux-saga'
import { encodeFunctionData, parseEventLogs } from 'viem'

const TAG = 'divviProtocol/registerReferral'

export function isRegistrationTransaction(tx: TransactionRequest | SerializableTransactionRequest) {
  return tx.to === REGISTRY_CONTRACT_ADDRESS // TOOD add method check
}

export function createRegistrationTransactions({
  networkId,
}: {
  networkId: NetworkId
}): TransactionRequest[] {
  const completedRegistrations = new Set(registrationsSelector(store.getState())[networkId] ?? [])
  const unregisteredProtocols = CONNECTED_PROTOCOL_IDS.filter(
    (protocol) => !completedRegistrations.has(protocol)
  )

  // TODO: read the contract and only create the transactions if the referrer
  // and protocol are registered. The gas estimation always fails when the
  // referrer or protocolId has not been registered, which will prevent the
  // sending of any transactions through preparedTransactions.

  // TODO: Also check if the user is already registered, if so, do not prepare
  // the transaction and dispatch the action to store the protocol as
  // registered.

  return unregisteredProtocols.map((protocolId) => ({
    to: REGISTRY_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: registryContractAbi,
      functionName: 'registerReferral',
      // TODO: we need to clearly document that the referrer name is the app
      // registry name, since the referrer registration is done separately to
      // building the app.
      args: [APP_REGISTRY_NAME, protocolId],
    }),
  }))
}

export function* sendPreparedRegistrationTransactions(
  txs: TransactionRequest[],
  network: Network,
  wallet: ViemWallet,
  nonce: number
) {
  for (let i = 0; i < txs.length; i++) {
    const signedTx = yield* call([wallet, 'signTransaction'], {
      ...txs[i],
      nonce: nonce++,
    } as any)
    const hash = yield* call([wallet, 'sendRawTransaction'], {
      serializedTransaction: signedTx,
    })

    Logger.debug(
      `${TAG}/sendPreparedRegistrationTransactions`,
      'Successfully sent transaction to the network',
      hash
    )

    const receipt = yield* call([publicClient[network], 'waitForTransactionReceipt'], {
      hash,
    })

    if (receipt.status === 'success') {
      const parsedLogs = parseEventLogs({
        abi: registryContractAbi,
        eventName: ['ReferralRegistered'],
        logs: receipt.logs,
      })

      if (parsedLogs.length !== 1) {
        Logger.error(
          'divvyProtocol/monitorRegistrationTransactions',
          'Unexpected number of matching logs for ReferralRegistered event'
        )
        return
      }

      const protocolId = supportedProtocolIdHashes[parsedLogs[0].args.protocolId]
      if (!protocolId) {
        // this should never happen, since we specify the protocolId in the prepareTransactions step
        Logger.error(
          `${TAG}/sendPreparedRegistrationTransactions`,
          `Unknown protocolId received from transaction ${hash}`
        )
        throw new Error(`Unknown protocolId received from transaction ${hash}`)
      }
      yield* put(registrationCompleted(networkConfig.networkToNetworkId[network], protocolId))
    }
  }
}
