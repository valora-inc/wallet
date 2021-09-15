import { CeloTx, CeloTxReceipt, EncodedTransaction, TransactionResult } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/wallet-base'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { call } from 'redux-saga/effects'
import { SendTransactionMethod, wrapSendTransactionWithRetry } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { SupportedActions } from 'src/walletConnect/constants'
import { getContractKit, getWallet, getWeb3 } from 'src/web3/contracts'
import { getAccountAddress, unlockAccount } from 'src/web3/saga'
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
  const account: string = yield call(getAccountAddress)
  const wallet: UnlockableWallet = yield call(getWallet)
  yield call(unlockAccount, account)

  switch (method) {
    case SupportedActions.eth_signTransaction:
      return (yield call(wallet.signTransaction.bind(wallet), params[0])) as EncodedTransaction
    case SupportedActions.eth_signTypedData:
      return (yield call(
        wallet.signTypedData.bind(wallet),
        account,
        JSON.parse(params[1])
      )) as string
    case SupportedActions.personal_decrypt:
      return (yield call(wallet.decrypt.bind(wallet), account, Buffer.from(params[1]))) as string
    case SupportedActions.eth_sendTransaction:
      const kit: ContractKit = yield call(getContractKit)
      const normalizer = new TxParamsNormalizer(kit.connection)
      const tx: CeloTx = yield call(normalizer.populate.bind(normalizer), params[0])
      const sendTxMethod: SendTransactionMethod = function* () {
        // TODO: this was needed to fix PoolTogether, we shouldn't use it for all requests
        const gasEstimate: number = yield call(kit.connection.estimateGas, {
          ...tx,
          gas: undefined,
        })
        const txResult: TransactionResult = yield call(kit.connection.sendTransaction, {
          ...tx,
          gas: kit.web3.utils.numberToHex(gasEstimate),
        })
        return yield call(txResult.waitReceipt.bind(txResult))
      }
      const receipt: CeloTxReceipt = yield call(
        wrapSendTransactionWithRetry,
        sendTxMethod,
        newTransactionContext(TAG, 'WalletConnect/eth_sendTransaction')
      )
      return receipt.transactionHash
    case SupportedActions.personal_sign:
      return (yield call(wallet.signPersonalMessage.bind(wallet), account, params[1])) as string
    case SupportedActions.eth_sign:
      const web3: Web3 = yield call(getWeb3)
      return (yield call(web3.eth.sign.bind(web3), params[1], account)) as string
    default:
      throw new Error('unsupported RPC method')
  }
}
