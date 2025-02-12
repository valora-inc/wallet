import { divviRegistrationCompleted } from 'src/app/actions'
import { divviRegistrationsSelector } from 'src/app/selectors'
import { DIVVI_PROTOCOL_IDS, DIVVI_REFERRER_ID } from 'src/config'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS, supportedProtocolIdHashes } from 'src/divviProtocol/constants'
import { store } from 'src/redux/store'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put } from 'typed-redux-saga'
import { Address, decodeFunctionData, encodeFunctionData, parseEventLogs } from 'viem'

const TAG = 'divviProtocol/registerReferral'

export function isRegistrationTransaction(tx: TransactionRequest | SerializableTransactionRequest) {
  try {
    return (
      tx.to === REGISTRY_CONTRACT_ADDRESS &&
      tx.data &&
      decodeFunctionData({
        abi: registryContractAbi,
        data: tx.data,
      }).functionName === 'registerReferral'
    )
  } catch (error) {
    // decodeFunctionData will throw if the data does not match any function in
    // the abi, but this is unlikely to happen since we are checking the "to"
    // address first. In any case, we should return false unless we are sure
    // that the transaction is a registration transaction.
    return false
  }
}

export async function createRegistrationTransactionsIfNeeded({
  networkId,
}: {
  networkId: NetworkId
}): Promise<TransactionRequest[]> {
  const referrerId = DIVVI_REFERRER_ID
  if (!referrerId) {
    Logger.debug(
      `${TAG}/createRegistrationTransactionsIfNeeded`,
      'No referrer id set. Skipping registration transactions.'
    )
    return []
  }

  // Caching registration status in Redux reduces on-chain checks but doesn’t guarantee
  // it wasn’t completed in a previous install or session.
  const completedRegistrations = new Set(
    divviRegistrationsSelector(store.getState())[networkId] ?? []
  )
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
  const walletAddress = walletAddressSelector(store.getState()) as Address
  await Promise.all(
    pendingRegistrations.map(async (protocolId) => {
      try {
        const [registeredReferrers, registeredUsers] = await Promise.all([
          client.readContract({
            address: REGISTRY_CONTRACT_ADDRESS,
            abi: registryContractAbi,
            functionName: 'getReferrers',
            args: [protocolId],
          }),
          // TODO: getUsers is not the correct call to get the registration
          // status of the user for any given protocol, we need to modify this
          // part once the correct call is available
          client.readContract({
            address: REGISTRY_CONTRACT_ADDRESS,
            abi: registryContractAbi,
            functionName: 'getUsers',
            args: [protocolId, referrerId],
          }),
        ])

        if (!registeredReferrers.includes(referrerId)) {
          Logger.error(
            `${TAG}/createRegistrationTransactionsIfNeeded`,
            `Referrer "${referrerId}" is not registered for protocol "${protocolId}". Skipping registration transaction.`
          )
          return
        }

        if (registeredUsers[0].some((address) => address.toLowerCase() === walletAddress)) {
          Logger.debug(
            `${TAG}/createRegistrationTransactionsIfNeeded`,
            `Referral is already registered for protocol "${protocolId}". Skipping registration transaction.`
          )
          store.dispatch(divviRegistrationCompleted(networkId, protocolId))
          return
        }

        protocolsEligibleForRegistration.push(protocolId)
      } catch (error) {
        Logger.error(
          `${TAG}/createRegistrationTransactionsIfNeeded`,
          `Error reading registration state for protocol "${protocolId}". Skipping registration transaction.`,
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
  networkId: NetworkId,
  wallet: ViemWallet,
  nonce: number
) {
  for (let i = 0; i < txs.length; i++) {
    try {
      const signedTx = yield* call([wallet, 'signTransaction'], {
        ...txs[i],
        nonce,
      } as any)
      const hash = yield* call([wallet, 'sendRawTransaction'], {
        serializedTransaction: signedTx,
      })

      Logger.debug(
        `${TAG}/sendPreparedRegistrationTransactions`,
        'Successfully sent transaction to the network',
        hash
      )
      nonce = nonce + 1

      const receipt = yield* call(
        [publicClient[networkIdToNetwork[networkId]], 'waitForTransactionReceipt'],
        {
          hash,
        }
      )

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
          continue
        }
        yield* put(divviRegistrationCompleted(networkId, protocolId))
      }
    } catch (error) {
      Logger.error(
        `${TAG}/sendPreparedRegistrationTransactions`,
        `Failed to send or parse prepared registration transaction`,
        error
      )
    }
  }

  return nonce
}
