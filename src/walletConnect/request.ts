import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { SupportedActions } from 'src/walletConnect/constants'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getWalletAddress, unlockAccount } from 'src/web3/saga'
import { call } from 'typed-redux-saga'
import { SignMessageParameters, formatTransaction } from 'viem'

export function* handleRequest({ method, params }: { method: string; params: any[] }) {
  const wallet: ViemWallet = yield* call(getViemWallet, networkConfig.viemChain.celo)

  const account: string = yield* call(getWalletAddress)
  yield* call(unlockAccount, account)
  // Call Sentry performance monitoring after entering pin if required
  SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_transaction)

  switch (method) {
    case SupportedActions.eth_signTransaction: {
      const rawTx: any = { ...params[0] }

      let tx: any
      // Provide an escape hatch for dapp developers who don't want any normalization
      if (rawTx.__skip_normalization) {
        delete rawTx.__skip_normalization
        tx = rawTx
      } else {
        tx = yield* call(normalizeTransaction, wallet, rawTx)
      }

      // Convert hex values to numeric ones for Viem
      // TODO: remove once Viem allows hex values as quanitites
      const formattedTx: any = yield* call(formatTransaction, tx)

      // TODO: estimate fee currency for Celo

      // Fill in missing values, if any:
      // - nonce
      // - maxFeePerGas
      // - maxPriorityFeePerGas
      const txRequest = yield* call([wallet, 'prepareTransactionRequest'], formattedTx)

      return (yield* call([wallet, 'signTransaction'], txRequest)) as string
    }
    case SupportedActions.eth_signTypedData_v4:
    case SupportedActions.eth_signTypedData:
      return (yield* call([wallet, 'signTypedData'], JSON.parse(params[1]))) as string
    case SupportedActions.eth_sendTransaction: {
      const rawTx: any = { ...params[0] }
      // Convert hex values to numeric ones for Viem
      // TODO: remove once Viem allows hex values as quanitites
      const normalizedTx: any = yield* call(normalizeTransaction, wallet, rawTx)
      const formattedTx: any = yield* call(formatTransaction, normalizedTx)

      // TODO: estimate fee currency for Celo

      // Fill in missing values, if any:
      // - nonce
      // - maxFeePerGas
      // - maxPriorityFeePerGas
      const txRequest = yield* call([wallet, 'prepareTransactionRequest'], formattedTx)
      return (yield* call([wallet, 'sendTransaction'], txRequest)) as string
    }
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

function normalizeTransaction(wallet: ViemWallet, rawTx: any) {
  const tx = { ...rawTx }

  // Handle `gasLimit` as a misnomer for `gas`
  if (tx.gasLimit && tx.gas === undefined) {
    tx.gas = tx.gasLimit
    delete tx.gasLimit
  }

  // Force upgrade legacy tx to EIP-1559/CIP-42/CIP-64
  if (tx.gasPrice !== undefined) {
    delete tx.gasPrice
  }

  return tx
}
