import { registrationCompleted } from 'src/app/actions'
import { registrationsSelector } from 'src/app/selectors'
import { DIVVI_PROTOCOL_IDS, DIVVI_REFERRER_ID } from 'src/config'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS, supportedProtocolIdHashes } from 'src/divviProtocol/constants'
import { store } from 'src/redux/store'
import { Network, NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { call, put } from 'typed-redux-saga'
import { decodeFunctionData, encodeFunctionData, parseEventLogs } from 'viem'

const TAG = 'divviProtocol/registerReferral'

export function isRegistrationTransaction(tx: TransactionRequest | SerializableTransactionRequest) {
  return (
    tx.to === REGISTRY_CONTRACT_ADDRESS &&
    tx.data &&
    decodeFunctionData({
      abi: registryContractAbi,
      data: tx.data,
    }).functionName === 'registerReferral'
  )
}

export async function createRegistrationTransactions({
  networkId,
}: {
  networkId: NetworkId
}): Promise<TransactionRequest[]> {
  const referrerId = DIVVI_REFERRER_ID
  if (!referrerId) {
    Logger.debug(
      `${TAG}/createRegistrationTransactions`,
      'No referrer id set. Skipping registration transactions.'
    )
    return []
  }

  const completedRegistrations = new Set(registrationsSelector(store.getState())[networkId] ?? [])
  const pendingRegistrations = DIVVI_PROTOCOL_IDS.filter(
    (protocol) => !completedRegistrations.has(protocol)
  )
  if (pendingRegistrations.length === 0) {
    return []
  }

  // Ensure the referrer and protocol are registered before creating
  // transactions to prevent gas estimation failures later.
  const client = publicClient[networkIdToNetwork[networkId]]
  const protocolsEligibleForRegistration: string[] = []
  await Promise.all(
    pendingRegistrations.map(async (protocolId) => {
      try {
        const [registeredReferrers] = await Promise.all([
          client.readContract({
            address: REGISTRY_CONTRACT_ADDRESS,
            abi: registryContractAbi,
            functionName: 'getReferrers',
            args: [protocolId],
          }),
          // TODO: check if the user is already registered for the protocol when
          // the method is added to the contract
        ])

        if (!registeredReferrers.includes(referrerId)) {
          Logger.error(
            `${TAG}/createRegistrationTransactions`,
            `Referrer "${referrerId}" is not registered for protocol "${protocolId}". Skipping registration transaction.`
          )
          return
        }

        protocolsEligibleForRegistration.push(protocolId)
      } catch (error) {
        Logger.error(
          `${TAG}/createRegistrationTransactions`,
          `Error reading registered referrers for protocol "${protocolId}". Skipping registration transaction.`,
          error
        )
      }
    })
  )

  return protocolsEligibleForRegistration.map((protocolId) => ({
    to: REGISTRY_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: registryContractAbi,
      functionName: 'registerReferral',
      args: [referrerId, protocolId],
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

  return nonce
}
