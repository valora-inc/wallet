import { CeloTx, CeloTxReceipt, EncodedTransaction } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/wallet-base'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { chooseTxFeeDetails, sendTransaction } from 'src/transactions/send'
import { Network, NetworkId, newTransactionContext } from 'src/transactions/types'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { SupportedActions } from 'src/walletConnect/constants'
import { getContractKit, getViemWallet, getWallet, getWeb3 } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getWalletAddress, unlockAccount } from 'src/web3/saga'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'
import { call } from 'typed-redux-saga'
import { GetTransactionCountParameters, SignMessageParameters, formatTransaction } from 'viem'
import { getTransactionCount } from 'viem/actions'
import Web3 from 'web3'

const TAG = 'WalletConnect/handle-request'

export const networkIdToWalletConnectChainId: Record<NetworkId, string> = {
  [NetworkId['celo-alfajores']]: 'eip155:44787',
  [NetworkId['celo-mainnet']]: 'eip155:42220',
  [NetworkId['ethereum-mainnet']]: 'eip155:1',
  [NetworkId['ethereum-sepolia']]: 'eip155:3',
}
const walletConnectChainIdToNetwork: Record<string, Network> = {
  'eip155:44787': Network.Celo,
  'eip155:42220': Network.Celo,
  'eip155:1': Network.Ethereum,
  'eip155:3': Network.Ethereum,
}

export function* handleRequest({
  request: { method, params },
  chainId,
}: Web3WalletTypes.EventArguments['session_request']['params']) {
  const network = walletConnectChainIdToNetwork[chainId]
  const useViem = yield* call(
    getFeatureGate,
    StatsigFeatureGates.USE_VIEM_FOR_WALLETCONNECT_TRANSACTIONS
  )

  if (!useViem && network !== Network.Celo) {
    throw new Error('unsupported network')
  }

  const wallet: ViemWallet = yield* call(getViemWallet, networkConfig.viemChain[network])
  const account = yield* call(getWalletAddress)
  const legacyWallet: UnlockableWallet = yield* call(getWallet)
  yield* call(unlockAccount, account)
  // Call Sentry performance monitoring after entering pin if required
  SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_transaction)

  // TODO: keep only Viem branch after feeCurrency estimation is ready
  if (useViem) {
    switch (method) {
      case SupportedActions.eth_signTransaction: {
        const rawTx: any = { ...params[0] }
        const normalizedTx: any = yield* call(normalizeTransaction, wallet, rawTx)
        const txRequest: any = yield* call(prepareTransactionRequest, wallet, normalizedTx)
        return (yield* call([wallet, 'signTransaction'], txRequest)) as string
      }
      case SupportedActions.eth_sendTransaction: {
        const rawTx: any = { ...params[0] }
        const normalizedTx: any = yield* call(normalizeTransaction, wallet, rawTx)
        const txRequest: any = yield* call(prepareTransactionRequest, wallet, normalizedTx)
        return (yield* call([wallet, 'sendTransaction'], txRequest)) as string
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

  // Legacy path
  switch (method) {
    case SupportedActions.eth_signTransaction: {
      // IMPORTANT: We need to normalize the transaction parameters
      // WalletConnect v1 utils currently strips away important fields like `chainId`, `feeCurrency`, `gatewayFee` and `gatewayFeeRecipient`
      // See https://github.com/WalletConnect/walletconnect-monorepo/blame/c6b26481c34848dbc9c49bb0d024bda907ec4599/packages/helpers/utils/src/ethereum.ts#L66-L86
      // Also the dapp developer may have omitted some of the needed fields,
      // so it's nice to be flexible and still allow the transaction to be signed (and sent) successfully

      const rawTx: any = { ...params[0] }
      let tx
      // Provide an escape hatch for dapp developers who don't want any normalization
      if (rawTx.__skip_normalization) {
        // Remove this custom field which may cause issues down the line
        delete rawTx.__skip_normalization
        tx = rawTx
      } else {
        const kit: ContractKit = yield* call(getContractKit)
        const normalizer = new TxParamsNormalizer(kit.connection)
        // For now if `feeCurrency` is not set, we don't know whether it was stripped by WalletConnect v1 utils or intentionally left out
        // to use CELO to pay for fees
        if (!rawTx.feeCurrency) {
          // This will use CELO to pay for fees if the user has a balance,
          // otherwise it will fallback to the first currency with a balance
          const {
            feeCurrency,
            gas,
          }: {
            feeCurrency: string | undefined
            gas?: number
          } = yield* call(
            chooseTxFeeDetails,
            buildTxo(kit, rawTx),
            rawTx.feeCurrency,
            rawTx.gas,
            rawTx.gasPrice
          )

          rawTx.feeCurrency = feeCurrency
          rawTx.gas = gas
          rawTx.gasPrice = undefined
        }
        applyChainIdWorkaround(rawTx, yield* call([kit.connection, 'chainId']))
        tx = yield* call(normalizer.populate.bind(normalizer), rawTx)
      }

      return (yield* call([legacyWallet, 'signTransaction'], tx)) as EncodedTransaction
    }
    case SupportedActions.eth_signTypedData_v4:
    case SupportedActions.eth_signTypedData:
      return (yield* call(
        [legacyWallet, 'signTypedData'],
        account,
        JSON.parse(params[1])
      )) as string
    case SupportedActions.eth_sendTransaction: {
      const rawTx = { ...params[0] }
      const kit: ContractKit = yield* call(getContractKit)
      const normalizer = new TxParamsNormalizer(kit.connection)
      applyChainIdWorkaround(rawTx, yield* call([kit.connection, 'chainId']))
      const tx: CeloTx = yield* call(normalizer.populate.bind(normalizer), rawTx)

      // This is a hack to turn the CeloTx into a CeloTxObject
      // so we can use our standard `sendTransaction` helper which takes care of setting the right `feeCurrency`, `gas` and `gasPrice`.
      // Dapps using this method usually leave `feeCurrency` undefined which then requires users to have a CELO balance which is not always the case
      // handling this ourselves, solves this issue.
      // TODO: bypass this if `feeCurrency` is set
      const txo = buildTxo(kit, tx)

      const receipt: CeloTxReceipt = yield* call(
        sendTransaction,
        txo,
        tx.from as string,
        newTransactionContext(TAG, 'WalletConnect/eth_sendTransaction')
      )
      return receipt.transactionHash
    }
    case SupportedActions.personal_sign:
      return (yield* call([legacyWallet, 'signPersonalMessage'], account, params[0])) as string
    case SupportedActions.eth_sign:
      const web3: Web3 = yield* call(getWeb3)
      return (yield* call(web3.eth.sign.bind(web3), params[1], account)) as string
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

function* prepareTransactionRequest(wallet: ViemWallet, rawTx: any) {
  // Convert hex values to numeric ones for Viem
  // TODO: remove once Viem allows hex values as quanitites
  const formattedTx: any = yield* call(formatTransaction, rawTx)

  // TODO: inject fee currency for Celo when it's ready

  // Fill in missing values, if any:
  // - nonce
  // - maxFeePerGas (with respect to feeCurrency)
  // - maxPriorityFeePerGas (with repsect to feeCurrency)
  if (!wallet.account) {
    // this should never happen
    throw new Error('no account found in the wallet')
  }
  const txCountParams: GetTransactionCountParameters = {
    address: wallet.account.address,
    blockTag: 'pending',
  }
  const nonce = formattedTx.nonce ?? (yield* call(getTransactionCount, wallet, txCountParams))
  const { maxFeePerGas, maxPriorityFeePerGas } = yield* call(
    estimateFeesPerGas,
    wallet,
    formattedTx.feeCurrency
  )
  const txRequest = {
    ...formattedTx,
    ...nonce,
    ...(formattedTx.maxFeePerGas === undefined ? { maxFeePerGas } : {}),
    ...(formattedTx.maxPriorityFeePerGas === undefined ? { maxPriorityFeePerGas } : {}),
  }

  return txRequest
}
