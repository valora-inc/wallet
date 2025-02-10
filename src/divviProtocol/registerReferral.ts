import { registrationCompleted } from 'src/app/actions'
import { APP_REGISTRY_NAME } from 'src/config'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS } from 'src/divviProtocol/constants'
import { SupportedProtocolIds } from 'src/divviProtocol/types'
import { Network } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import { all, call, put } from 'typed-redux-saga'
import { encodeFunctionData, Hash, parseEventLogs } from 'viem'

export function createRegistrationTransactions(
  protocolIds: SupportedProtocolIds[]
): TransactionRequest[] {
  return protocolIds.map((protocolId) => ({
    to: REGISTRY_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: registryContractAbi,
      functionName: 'registerReferral',
      args: [APP_REGISTRY_NAME, protocolId], // TODO check if it's okay to use APP_REGISTRY_NAME - will builders already know this?
    }),
  }))
}

export function* monitorRegistrationTransactions(txHashes: Hash[], network: Network) {
  yield* all(
    txHashes.map(function* (txHash) {
      const receipt = yield* call([publicClient[network], 'waitForTransactionReceipt'], {
        hash: txHash,
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

        const { protocolId } = parsedLogs[0].args
        yield* put(
          registrationCompleted(
            networkConfig.networkToNetworkId[network],
            protocolId as SupportedProtocolIds
          )
        )
      } else {
        // TODO handle UserAlreadyRegistered, log warning if the registration does not belong to this app
        // TODO handle ReferrerNotRegistered - what do we do here? queue it up for later?
      }
    })
  )
}
