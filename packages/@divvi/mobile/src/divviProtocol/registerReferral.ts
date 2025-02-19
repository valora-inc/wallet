import { divviRegistrationCompleted } from 'src/app/actions'
import { divviRegistrationsSelector } from 'src/app/selectors'
import { getAppConfig } from 'src/appConfig'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import {
  REGISTRY_CONTRACT_ADDRESS,
  SupportedProtocolId,
  supportedProtocolIds,
} from 'src/divviProtocol/constants'
import { store } from 'src/redux/store'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, spawn } from 'typed-redux-saga'
import {
  Address,
  decodeFunctionData,
  encodeFunctionData,
  Hash,
  Hex,
  hexToString,
  parseEventLogs,
  stringToHex,
} from 'viem'

const TAG = 'divviProtocol/registerReferral'

export function isRegistrationTransaction(tx: TransactionRequest | SerializableTransactionRequest) {
  try {
    return (
      tx.to === REGISTRY_CONTRACT_ADDRESS &&
      tx.data &&
      decodeFunctionData({
        abi: registryContractAbi,
        data: tx.data,
      }).functionName === 'registerReferrals'
    )
  } catch (error) {
    // decodeFunctionData will throw if the data does not match any function in
    // the abi, but this is unlikely to happen since we are checking the "to"
    // address first. In any case, we should return false unless we are sure
    // that the transaction is a registration transaction.
    return false
  }
}

export async function createRegistrationTransactionIfNeeded({
  networkId,
}: {
  networkId: NetworkId
}): Promise<TransactionRequest | null> {
  const appConfig = getAppConfig()
  if (!appConfig.divviProtocol) {
    Logger.warn(
      `${TAG}/createRegistrationTransactionsIfNeeded`,
      'No divviProtocol config found. Skipping registration transaction.'
    )
    return null
  }

  const { referrerId, protocolIds } = appConfig.divviProtocol

  // Caching registration status in Redux reduces on-chain checks but doesn’t guarantee
  // it wasn’t completed in a previous install or session.
  const completedRegistrations = new Set(
    divviRegistrationsSelector(store.getState())[networkId] ?? []
  )
  const pendingRegistrations = protocolIds.filter(
    (protocol) => !completedRegistrations.has(protocol)
  )
  if (pendingRegistrations.length === 0) {
    return null
  }

  const client = publicClient[networkIdToNetwork[networkId]]
  const walletAddress = walletAddressSelector(store.getState()) as Address
  const pendingRegistrationsHex = pendingRegistrations.map((protocol) =>
    stringToHex(protocol, { size: 32 })
  )
  const referrerIdHex = stringToHex(referrerId, { size: 32 })

  const protocolsToRegisterHex: Hex[] = []
  const protocolsAlreadyRegistered: SupportedProtocolId[] = []
  const referrerUnregisteredProtocols: SupportedProtocolId[] = []

  try {
    const [isUserRegisteredForProtocols, ...registeredReferrersForProtocols] = await Promise.all([
      client.readContract({
        address: REGISTRY_CONTRACT_ADDRESS,
        abi: registryContractAbi,
        functionName: 'isUserRegistered',
        args: [walletAddress, pendingRegistrationsHex],
      }),
      ...pendingRegistrationsHex.map((protocolHex) =>
        client.readContract({
          address: REGISTRY_CONTRACT_ADDRESS,
          abi: registryContractAbi,
          functionName: 'getReferrers',
          args: [protocolHex],
        })
      ),
    ])

    for (let i = 0; i < pendingRegistrationsHex.length; i++) {
      const protocolId = pendingRegistrations[i]
      const protocolIdHex = pendingRegistrationsHex[i]
      const isUserAlreadyRegistered = isUserRegisteredForProtocols[i]
      const registeredReferrers = registeredReferrersForProtocols[i]

      if (!registeredReferrers.includes(referrerIdHex)) {
        referrerUnregisteredProtocols.push(protocolId)
        continue
      }

      if (isUserAlreadyRegistered) {
        protocolsAlreadyRegistered.push(protocolId)
        continue
      }

      protocolsToRegisterHex.push(protocolIdHex)
    }
  } catch (error) {
    Logger.error(
      `${TAG}/createRegistrationTransactionsIfNeeded`,
      `Error reading registration state. Skipping registration transaction.`,
      error
    )
    return null
  }

  if (protocolsAlreadyRegistered.length > 0) {
    Logger.warn(
      `${TAG}/createRegistrationTransactionsIfNeeded`,
      `User is already registered for protocols "${protocolsAlreadyRegistered.join(
        ', '
      )}". Skipping registration for those protocols.`
    )
    store.dispatch(divviRegistrationCompleted(networkId, protocolsAlreadyRegistered))
  }

  if (referrerUnregisteredProtocols.length > 0) {
    Logger.warn(
      `${TAG}/createRegistrationTransactionsIfNeeded`,
      `Referrer is not registered for protocols "${referrerUnregisteredProtocols.join(
        ', '
      )}". Skipping registration for those protocols.`
    )
  }

  if (protocolsToRegisterHex.length === 0) {
    return null
  }

  return {
    from: walletAddress,
    to: REGISTRY_CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: registryContractAbi,
      functionName: 'registerReferrals',
      args: [referrerIdHex, protocolsToRegisterHex],
    }),
  }
}

export function* sendPreparedRegistrationTransaction(
  tx: TransactionRequest,
  networkId: NetworkId,
  wallet: ViemWallet,
  nonce: number
) {
  try {
    const signedTx = yield* call([wallet, 'signTransaction'], {
      ...tx,
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

    yield* spawn(monitorRegistrationTransaction, hash, networkId)
  } catch (error) {
    Logger.error(
      `${TAG}/sendPreparedRegistrationTransactions`,
      `Failed to send or parse prepared registration transaction`,
      error
    )
    throw error
  }
}

export function* monitorRegistrationTransaction(hash: Hash, networkId: NetworkId) {
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

    const registeredProtocolIds = parsedLogs
      .map((log) => hexToString(log.args.protocolId, { size: 32 }))
      .filter((protocolId: string): protocolId is SupportedProtocolId => {
        if ((supportedProtocolIds as readonly string[]).includes(protocolId)) {
          return true
        } else {
          Logger.error(
            `${TAG}/monitorRegistrationTransaction`,
            `Received unsupported protocol id "${protocolId}" in ReferralRegistered event`
          )
          return false
        }
      })

    if (registeredProtocolIds.length > 0) {
      yield* put(divviRegistrationCompleted(networkId, registeredProtocolIds))
    }
  }
}
