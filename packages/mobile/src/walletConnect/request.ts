import { CeloTx, EncodedTransaction, TransactionResult } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/wallet-base'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { call, select } from 'redux-saga/effects'
import { wrapSendTransactionWithRetry } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { SupportedActions } from 'src/walletConnect/constants'
import { getContractKit, getWallet } from 'src/web3/contracts'
import { unlockAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'WalletConnect/handle-request'

export interface WalletResponseError {
  isError: true
  error: string
}
export interface WalletResponseSuccess {
  isError: false
  result: string
}

export function* handleRequest({ method, params }: any) {
  const account: string = yield select(currentAccountSelector)
  const wallet: UnlockableWallet = yield call(getWallet)

  yield call(unlockAccount, account)
  switch (method) {
    case SupportedActions.eth_signTransaction:
      return ((yield call(wallet.signTransaction.bind(wallet), params)) as EncodedTransaction).raw
    case SupportedActions.eth_signTypedData:
      return call(wallet.signTypedData.bind(wallet), account, JSON.parse(params[1]))
    case SupportedActions.personal_decrypt:
      return call(wallet.decrypt.bind(wallet), account, Buffer.from(params[1]))
    case SupportedActions.eth_sendTransaction:
      const kit: ContractKit = yield call(getContractKit)
      const normalizer = new TxParamsNormalizer(kit.connection)
      const tx: CeloTx = yield call(normalizer.populate.bind(normalizer), params)

      const sendTxMethod = function* (nonce?: number) {
        const txResult: TransactionResult = yield call(kit.connection.sendTransaction, {
          ...tx,
          nonce: nonce ?? tx.nonce,
        })
        return call(txResult.getHash.bind(txResult))
      }
      return call(
        // @ts-ignore
        wrapSendTransactionWithRetry,
        sendTxMethod,
        newTransactionContext(TAG, 'WalletConnect/eth_sendTransaction')
      )
    case SupportedActions.personal_sign:
      return call(wallet.signPersonalMessage.bind(wallet), account, params[1])
    default:
      throw new Error('unsupported RPC method')
  }
}
