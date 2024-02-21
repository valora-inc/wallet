import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import Logger from 'src/utils/Logger'
import { ViemWallet } from 'src/viem/getLockableWallet'
import {
  SerializableTransactionRequest,
  getPreparedTransaction,
} from 'src/viem/preparedTransactionSerialization'
import { SupportedActions } from 'src/walletConnect/constants'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig, { walletConnectChainIdToNetwork } from 'src/web3/networkConfig'
import { getWalletAddress, unlockAccount } from 'src/web3/saga'
import { call } from 'typed-redux-saga'
import { SignMessageParameters } from 'viem'

const TAG = 'WalletConnect/request'

export function* handleRequest(
  {
    request: { method, params },
    chainId,
  }: Web3WalletTypes.EventArguments['session_request']['params'],
  serializableTransactionRequest?: SerializableTransactionRequest
) {
  const network = walletConnectChainIdToNetwork[chainId]
  if (!networkConfig.viemChain[network]) {
    throw new Error('unsupported network')
  }

  const wallet: ViemWallet = yield* call(getViemWallet, networkConfig.viemChain[network])
  const account = yield* call(getWalletAddress)
  yield* call(unlockAccount, account)
  // Call Sentry performance monitoring after entering pin if required
  SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_transaction)

  switch (method) {
    case SupportedActions.eth_signTransaction: {
      if (!serializableTransactionRequest) {
        throw new Error('preparedTransaction is required when using viem')
      }
      const tx = getPreparedTransaction(serializableTransactionRequest)
      Logger.debug(TAG + '@handleRequest', 'Signing transaction', tx)
      return yield* call(
        [wallet, 'signTransaction'],
        // TODO: fix types
        tx as any
      )
    }
    case SupportedActions.eth_sendTransaction: {
      if (!serializableTransactionRequest) {
        throw new Error('preparedTransaction is required when using viem')
      }
      const tx = getPreparedTransaction(serializableTransactionRequest)
      Logger.debug(TAG + '@handleRequest', 'Sending transaction', tx)
      const hash = yield* call(
        [wallet, 'sendTransaction'],
        // TODO: fix types
        tx as any
      )
      Logger.debug(TAG + '@handleRequest', 'Sent transaction', hash)
      return hash
    }
    case SupportedActions.eth_signTypedData_v4:
    case SupportedActions.eth_signTypedData:
      return (yield* call([wallet, 'signTypedData'], JSON.parse(params[1]))) as string
    case SupportedActions.personal_sign: {
      const data = { message: { raw: params[0] } } as SignMessageParameters
      return (yield* call([wallet, 'signMessage'], data)) as string
    }
    case SupportedActions.eth_sign: {
      const data = { message: { raw: params[1] } } as SignMessageParameters
      return (yield* call([wallet, 'signMessage'], data)) as string
    }
    default:
      throw new Error('unsupported RPC method')
  }
}
