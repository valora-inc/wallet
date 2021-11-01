import { CeloTx, CeloTxObject, CeloTxReceipt, EncodedTransaction, PromiEvent } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/wallet-base'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { call } from 'redux-saga/effects'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { SupportedActions } from 'src/walletConnect/constants'
import { getContractKit, getWallet, getWeb3 } from 'src/web3/contracts'
import { getWalletAddress, unlockAccount } from 'src/web3/saga'
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

      // This is a hack to turn the CeloTx into a CeloTxObject
      // so we can use our standard `sendTransaction` helper which takes care of setting the right `feeCurrency`, `gas` and `gasPrice`.
      // Dapps using this method usually leave `feeCurrency` undefined which then requires users to have a CELO balance which is not always the case
      // handling this ourselves, solves this issue.
      // TODO: bypass this if `feeCurrency` is set
      const txo: CeloTxObject<never> = {
        get arguments(): any[] {
          throw new Error('Fake TXO not implemented')
        },
        call(unusedTx?: CeloTx) {
          throw new Error('Fake TXO not implemented')
        },
        // updatedTx contains the `feeCurrency`, `gas`, and `gasPrice` set by our `sendTransaction` helper
        send(updatedTx?: CeloTx): PromiEvent<CeloTxReceipt> {
          return kit.web3.eth.sendTransaction({
            ...tx,
            ...updatedTx,
          })
        },
        // updatedTx contains the `feeCurrency`, and `gasPrice` set by our `sendTransaction` helper
        estimateGas(updatedTx?: CeloTx): Promise<number> {
          return kit.connection.estimateGas({
            ...tx,
            ...updatedTx,
            gas: undefined,
          })
        },
        encodeABI(): string {
          return tx.data ?? ''
        },
        _parent: {
          // @ts-ignore
          _address: tx.to,
        },
      }

      const receipt: CeloTxReceipt = yield call(
        sendTransaction,
        txo,
        tx.from as string,
        newTransactionContext(TAG, 'WalletConnect/eth_sendTransaction')
      )
      return receipt.transactionHash
    case SupportedActions.personal_sign:
      return (yield call([wallet, 'signPersonalMessage'], account, params[0])) as string
    case SupportedActions.eth_sign:
      const web3: Web3 = yield call(getWeb3)
      return (yield call(web3.eth.sign.bind(web3), params[1], account)) as string
    default:
      throw new Error('unsupported RPC method')
  }
}
