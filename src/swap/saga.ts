import { CeloTx } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { PayloadAction } from '@reduxjs/toolkit'
import { call, put, select, takeLatest } from 'redux-saga/effects'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
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
import { ApproveTransaction, Field, SwapInfo, SwapTransaction } from 'src/swap/types'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'

const TAG = 'swap/saga'

function getPercentageDifference(price1: number, price2: number) {
  return (Math.abs(price1 - price2) / ((price1 + price2) / 2)) * 100
}

function* handleSendSwapTransaction(
  rawTx: ApproveTransaction | SwapTransaction,
  tagDescription: string
) {
  const kit: ContractKit = yield call(getContractKit)
  const walletAddress: string = yield call(getConnectedUnlockedAccount)
  const normalizer = new TxParamsNormalizer(kit.connection)

  applyChainIdWorkaround(rawTx, yield call([kit.connection, 'chainId']))
  const tx: CeloTx = yield call(normalizer.populate.bind(normalizer), rawTx)
  const txo = buildTxo(kit, tx)
  yield call(sendTransaction, txo, walletAddress, newTransactionContext(TAG, tagDescription))
}

export function* swapSubmitSaga(action: PayloadAction<SwapInfo>) {
  try {
    // Navigate to swap pending screen
    yield call(navigate, Screens.SwapExecuteScreen)

    // Check that our guaranteedPrice is within 2%, maxSwapSlippagePercentage, of of the price
    const maxSlippagePercent: number = yield select(maxSwapSlippagePercentageSelector)
    const { price, guaranteedPrice, buyTokenAddress, sellTokenAddress } =
      action.payload.unvalidatedSwapTransaction
    const priceDiff: number = yield call(getPercentageDifference, +price, +guaranteedPrice)
    if (priceDiff >= maxSlippagePercent) {
      yield put(swapPriceChange())
      ValoraAnalytics.track(SwapEvents.swap_execute_price_change, {
        price,
        guaranteedPrice,
        toToken: buyTokenAddress,
        fromToken: sellTokenAddress,
      })
      return
    }

    const walletAddress: string = yield select(walletAddressSelector)

    // Approve transaction
    yield put(swapApprove())
    Logger.debug(TAG, `Starting to swap approval for address: ${walletAddress}`)
    yield call(handleSendSwapTransaction, { ...action.payload.approveTransaction }, 'Swap/Approve')

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
      throw new Error(`Got non-ok response from executeSwap: ${response.status}`)
    }
    const responseJson: { validatedSwapTransaction: SwapTransaction } = yield call([
      response,
      'json',
    ])

    // Execute transaction
    yield put(swapExecute())
    Logger.debug(TAG, `Starting to swap execute for address: ${walletAddress}`)
    yield call(handleSendSwapTransaction, responseJson.validatedSwapTransaction, 'Swap/Execute')

    yield put(swapSuccess())
    ValoraAnalytics.track(SwapEvents.swap_execute_success, {
      toToken: responseJson.validatedSwapTransaction.buyTokenAddress,
      fromToken: responseJson.validatedSwapTransaction.sellTokenAddress,
      amount: responseJson.validatedSwapTransaction[amountType],
      amountType: amountType,
      price: responseJson.validatedSwapTransaction.price,
    })
  } catch (error) {
    Logger.debug(TAG, 'Error while swapping', error)
    ValoraAnalytics.track(SwapEvents.swap_execute_error, {
      error: error.message,
    })
    yield put(swapError())
  }
}

export function* swapSaga() {
  yield takeLatest(swapStart.type, swapSubmitSaga)
}
