import { registrationCompleted } from 'src/app/actions'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS, supportedProtocolIdHashes } from 'src/divviProtocol/constants'
import { SupportedProtocolIds } from 'src/divviProtocol/types'
import { Network } from 'src/transactions/types'
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

export function createRegistrationTransactions(
  protocolIds: SupportedProtocolIds[]
): TransactionRequest[] {
  return protocolIds.map((protocolId) => ({
    to: REGISTRY_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: registryContractAbi,
      functionName: 'registerReferral',
      // args: [APP_REGISTRY_NAME, protocolId], // TODO check if it's okay to use APP_REGISTRY_NAME - will builders already know this?
      args: ['testReferrer1', protocolId],
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
      if (protocolId) {
        yield* put(registrationCompleted(networkConfig.networkToNetworkId[network], protocolId))
      } else {
        // TODO
      }
    } else {
      // TODO handle UserAlreadyRegistered, log warning if the registration does not belong to this app
      // TODO handle ReferrerNotRegistered - what do we do here? queue it up for later?
      console.log('====failed tx')
    }
  }
}
