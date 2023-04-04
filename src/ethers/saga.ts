import '@ethersproject/shims'
import { ethers } from 'ethers'
import { call, put } from 'redux-saga/effects'
import erc20 from 'src/abis/IERC20.json'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CeloIERC20, getCeloProvider, getEthersWallet } from 'src/ethers/wallet'
import { FeeInfo } from 'src/fees/saga'
import { fetchTokenBalances } from 'src/tokens/slice'
import {
  addHashToStandbyTransaction,
  removeStandbyTransaction,
  transactionConfirmed,
  transactionFailed,
} from 'src/transactions/actions'
import { TransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'ethers/saga'

/**
 *
 * @param param0
 * @returns
 */
export function* sendAndMonitorTransaction({
  context,
  recipientAddress,
  amount,
  tokenAddress,
  feeInfo,
}: {
  context: TransactionContext
  recipientAddress: string
  amount: ethers.BigNumber
  tokenAddress: string
  feeInfo: FeeInfo
}) {
  try {
    const userAddress: string = yield call(getConnectedUnlockedAccount)

    // Get the ethers wallet and provider
    const wallet: ethers.Wallet | undefined = yield call(getEthersWallet, userAddress)
    const provider: ethers.providers.JsonRpcProvider | undefined = yield call(getCeloProvider)

    if (!wallet || !provider) throw new Error('Wallet or provider not initialized')

    const connectedWallet = wallet.connect(provider)

    // TODO: For CELO chain, determine whether to use CELO or one of the stable tokens as feeCurrency
    // Similar to chooseTxFeeDetails in src/transactions/send.ts

    // Construct the args for the contract transfer funtion
    const transferArgs: Parameters<CeloIERC20['transfer']> = [
      recipientAddress,
      amount,
      {
        feeCurrency: feeInfo.feeCurrency,
        gasPrice: ethers.BigNumber.from(feeInfo.gasPrice),
        gasLimit: ethers.BigNumber.from(feeInfo.gas),
      },
    ]

    // Initiate the transfer
    const contract = new ethers.Contract(
      tokenAddress,
      erc20.abi,
      connectedWallet
    ) as unknown as CeloIERC20
    const tx: ethers.ContractTransaction = yield call(contract.transfer, ...transferArgs)

    // Add the tx to the standby transactions
    yield put(addHashToStandbyTransaction(context.id, tx.hash))

    // Wait for the tx to be confirmed
    const txReceipt: ethers.ContractReceipt = yield call(tx.wait)

    // Update the tx status and refetch the token balances
    yield put(transactionConfirmed(context.id, !!txReceipt.status))
    yield put(fetchTokenBalances({ showLoading: true }))
    return { receipt: txReceipt }
  } catch (error) {
    Logger.error(`${TAG}@sendAndMonitorTransaction`, `Error sending tx ${context.id}`, error)
    yield put(removeStandbyTransaction(context.id))
    yield put(transactionFailed(context.id))
    yield put(showError(ErrorMessages.TRANSACTION_FAILED))
    return { error }
  }
}
