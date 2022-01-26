import { CeloTx, CeloTxObject, CeloTxReceipt, EncodedTransaction, PromiEvent } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/wallet-base'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import BigNumber from 'bignumber.js'
import { call } from 'redux-saga/effects'
import { chooseFeeCurrency, sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { SupportedActions } from 'src/walletConnect/constants'
import { getContractKit, getWallet, getWeb3 } from 'src/web3/contracts'
import { getWalletAddress, unlockAccount } from 'src/web3/saga'
import Web3 from 'web3'

const TAG = 'WalletConnect/handle-request'

// Additional gas added when setting the fee currency
// See details where used.
const STATIC_GAS_PADDING = 50_000

export interface WalletResponseError {
  isError: true
  error: string
}
export interface WalletResponseSuccess {
  isError: false
  result: string
}

// This is meant to be called before normalizer.populate
// There's a bug in TxParamsNormalizer that sets the chainId as a number if not present
// but then if no gas is set, the estimateGas call will fail with espresso hardfork nodes
// with the error: `Gas estimation failed: Could not decode transaction failure reason or Error: invalid argument 0: json: cannot unmarshal non-string into Go struct field TransactionArgs.chainId of type *hexutil.Big`
// So here we make sure the chainId is set as a hex string so estimateGas works
// TODO: consider removing this when TxParamsNormalizer is fixed
function applyChainIdWorkaround(tx: any, chainId: number) {
  tx.chainId = `0x${new BigNumber(tx.chainId || chainId).toString(16)}`
  return tx
}

export function* handleRequest({ method, params }: { method: string; params: any[] }) {
  const account: string = yield call(getWalletAddress)
  const wallet: UnlockableWallet = yield call(getWallet)
  yield call(unlockAccount, account)

  switch (method) {
    case SupportedActions.eth_signTransaction: {
      // IMPORTANT: We need to normalize the transaction parameters
      // WalletConnect v1 utils currently strips away important fields like `chainId`, `feeCurrency`, `gatewayFee` and `gatewayFeeRecipient`
      // See https://github.com/WalletConnect/walletconnect-monorepo/blame/c6b26481c34848dbc9c49bb0d024bda907ec4599/packages/helpers/utils/src/ethereum.ts#L66-L86
      // Also the dapp developer may have omitted some of the needed fields,
      // so it's nice to be flexible and still allow the transaction to be signed (and sent) successfully

      const rawTx = { ...params[0] }
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
          const feeCurrency: string | undefined = yield call(chooseFeeCurrency, undefined)

          rawTx.feeCurrency = feeCurrency
          // If gas was set, we add some padding to it since we don't know if feeCurrency changed
          // and it takes a bit more gas to pay for fees using a non-CELO fee currency.
          // Why aren't we just estimating again?
          // It may result in errors for the dapp. E.g. If a dapp developer is doing a two step approve and exchange and requesting both signatures
          // together, they will set the gas on the second transaction because if estimateGas is run before the approve completes, execution will fail.
          if (rawTx.gas && feeCurrency) {
            rawTx.gas = new BigNumber(rawTx.gas).plus(STATIC_GAS_PADDING).toString()
          }
          // We're resetting gasPrice here because if the feeCurrency has changed, we need to fetch it again
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
