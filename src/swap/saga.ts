import { CeloTx } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { PayloadAction } from '@reduxjs/toolkit'
import { call, put, select, takeLatest } from 'redux-saga/effects'
import { maxSwapSlippagePercentageSelector } from 'src/app/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  swapApprove,
  swapError,
  swapExecute,
  swapPriceChange,
  swapStart,
  swapSuccess,
} from 'src/swap/slice'
import { Field, SwapInfo, SwapTransaction } from 'src/swap/types'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext, TransactionContext } from 'src/transactions/types'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'

const TAG = 'swap/saga'

function getPercentageDifference(price1: number, price2: number) {
  return (Math.abs(price1 - price2) / ((price1 + price2) / 2)) * 100
}

async function sendSwapTransaction(
  rawTx: CeloTx,
  txContext: TransactionContext,
  kit: ContractKit,
  normalizer: TxParamsNormalizer,
  walletAddress: string
) {
  applyChainIdWorkaround(rawTx, await kit.connection.chainId())
  const tx: CeloTx = (normalizer.populate.bind(normalizer), rawTx)
  const txo = buildTxo(kit, tx)
  sendTransaction(txo, walletAddress, txContext)
}

export function* swapSubmitSaga(action: PayloadAction<SwapInfo>) {
  try {
    // Navigate to swap pending screen
    yield call(navigate, Screens.SwapPending)

    // Check that our guaranteedPrice is within 2%, maxSwapSlippagePercentage, of of the price
    const maxSlippagePercent: number = yield select(maxSwapSlippagePercentageSelector)
    const priceDiff: number = yield call(
      getPercentageDifference,
      +action.payload.unvalidatedSwapTransaction.price,
      +action.payload.unvalidatedSwapTransaction.guaranteedPrice
    )
    if (priceDiff >= maxSlippagePercent) {
      yield put(swapPriceChange())
      return
    }

    // Set contract kit, wallet address and normalizer
    const kit: ContractKit = yield call(getContractKit)
    const walletAddress: string = yield call(getConnectedUnlockedAccount)
    const normalizer = new TxParamsNormalizer(kit.connection)

    // Approve transaction
    yield put(swapApprove())
    Logger.debug(TAG, `Starting to swap approval for address: ${walletAddress}`)
    yield call(
      sendSwapTransaction,
      { ...action.payload.approveTransaction },
      newTransactionContext(TAG, 'Swap/Approve'),
      kit,
      normalizer,
      walletAddress
    )

    // Query the execute swap endpoint
    const amountType =
      action.payload.userInput.updatedField === Field.TO ? 'buyAmount' : 'sellAmount'
    const amount = action.payload.unvalidatedSwapTransaction[amountType]
    const params = {
      buyToken: action.payload.unvalidatedSwapTransaction.buyTokenAddress,
      sellToken: action.payload.unvalidatedSwapTransaction.sellTokenAddress,
      [amountType]: amount,
      userAddress: walletAddress,
    }
    const queryParams = new URLSearchParams({ ...params }).toString()
    const requestUrl = `${networkConfig.executeSwapUrl}?${queryParams}`
    const response: Response = yield call(fetchWithTimeout, requestUrl)
    if (!response.ok) {
      Logger.error(TAG, `Swap failed with status: ${response.status}`)
      yield put(swapError())
      return
    }
    const responseJson: { validatedSwapTransaction: SwapTransaction } = yield call([
      response,
      'json',
    ])

    // Execute transaction
    yield put(swapExecute())
    Logger.debug(TAG, `Starting to swap execute for address: ${walletAddress}`)
    yield call(
      sendSwapTransaction,
      { ...responseJson.validatedSwapTransaction },
      newTransactionContext(TAG, 'Swap/Execute'),
      kit,
      normalizer,
      walletAddress
    )
    yield put(swapSuccess())
  } catch (error) {
    Logger.error(TAG, 'Error while swapping', error)
    yield put(swapError())
  }
}

export function* swapSaga() {
  yield takeLatest(swapStart.type, swapSubmitSaga)
}
