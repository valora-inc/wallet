import { CeloTx, CeloTxReceipt, EncodedTransaction } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/wallet-base'
import { call } from 'redux-saga/effects'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { chooseTxFeeDetails, sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { SupportedActions } from 'src/walletConnect/constants'
import { getContractKit, getWallet, getWeb3 } from 'src/web3/contracts'
import { getWalletAddress, unlockAccount } from 'src/web3/saga'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'
import Web3 from 'web3'

const TAG = 'WalletConnect/handle-request'

export interface WalletResponseError {
  isError: true
  error: string
}
export interface WalletResponseSuccess {
  isError: false
  result: string
}

export function* handleRequest({ method, params }: { method: string; params: any[] }) {
  const account: string = yield call(getWalletAddress)
  const wallet: UnlockableWallet = yield call(getWallet)
  yield call(unlockAccount, account)
  // Call Sentry performance monitoring after entering pin if required
  SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_transaction)

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
        const kit: ContractKit = yield call(getContractKit)
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
          } = yield call(
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
        applyChainIdWorkaround(rawTx, yield call([kit.connection, 'chainId']))
        tx = yield call(normalizer.populate.bind(normalizer), rawTx)
      }

      return (yield call([wallet, 'signTransaction'], tx)) as EncodedTransaction
    }
    case SupportedActions.eth_signTypedData_v4:
    case SupportedActions.eth_signTypedData:
      return (yield call([wallet, 'signTypedData'], account, JSON.parse(params[1]))) as string
    case SupportedActions.personal_decrypt:
      return (yield call(wallet.decrypt.bind(wallet), account, Buffer.from(params[1]))) as string
    case SupportedActions.eth_sendTransaction: {
      const rawTx = { ...params[0] }
      const kit: ContractKit = yield call(getContractKit)
      const normalizer = new TxParamsNormalizer(kit.connection)
      applyChainIdWorkaround(rawTx, yield call([kit.connection, 'chainId']))
      const tx: CeloTx = yield call(normalizer.populate.bind(normalizer), rawTx)

      // This is a hack to turn the CeloTx into a CeloTxObject
      // so we can use our standard `sendTransaction` helper which takes care of setting the right `feeCurrency`, `gas` and `gasPrice`.
      // Dapps using this method usually leave `feeCurrency` undefined which then requires users to have a CELO balance which is not always the case
      // handling this ourselves, solves this issue.
      // TODO: bypass this if `feeCurrency` is set
      const txo = buildTxo(kit, tx)

      const receipt: CeloTxReceipt = yield call(
        sendTransaction,
        txo,
        tx.from as string,
        newTransactionContext(TAG, 'WalletConnect/eth_sendTransaction')
      )
      return receipt.transactionHash
    }
    case SupportedActions.personal_sign:
      return (yield call([wallet, 'signPersonalMessage'], account, params[0])) as string
    case SupportedActions.eth_sign:
      const web3: Web3 = yield call(getWeb3)
      return (yield call(web3.eth.sign.bind(web3), params[1], account)) as string
    default:
      throw new Error('unsupported RPC method')
  }
}
