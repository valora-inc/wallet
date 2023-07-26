import { CeloTransactionObject, CeloTx, Contract, toTransactionObject } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { PayloadAction } from '@reduxjs/toolkit'
import { call, put, select, takeLatest } from 'redux-saga/effects'
import { SwapEvents } from 'src/analytics/Events'
import { SwapTimeMetrics } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { maxSwapSlippagePercentageSelector } from 'src/app/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { vibrateError, vibrateSuccess } from 'src/styles/hapticFeedback'
import {
  swapApprove,
  swapError,
  swapExecute,
  swapPriceChange,
  swapStart,
  swapSuccess,
} from 'src/swap/slice'
import { Field, SwapInfo, SwapTransaction } from 'src/swap/types'
import { getERC20TokenContract } from 'src/tokens/saga'
import { swappableTokensSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { sendTransaction } from 'src/transactions/send'
import { TransactionContext, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'

const TAG = 'swap/saga'

function getPercentageDifference(price1: number, price2: number) {
  return (Math.abs(price1 - price2) / ((price1 + price2) / 2)) * 100
}

function* handleSendSwapTransaction(
  rawTx: SwapTransaction,
  transactionContext: TransactionContext
) {
  const kit: ContractKit = yield call(getContractKit)
  const walletAddress: string = yield call(getConnectedUnlockedAccount)
  const normalizer = new TxParamsNormalizer(kit.connection)

  applyChainIdWorkaround(rawTx, yield call([kit.connection, 'chainId']))
  const tx: CeloTx = yield call(normalizer.populate.bind(normalizer), rawTx)
  const txo = buildTxo(kit, tx)

  yield call(sendTransaction, txo, walletAddress, transactionContext)
}

export function* swapSubmitSaga(action: PayloadAction<SwapInfo>) {
  const {
    price,
    guaranteedPrice,
    buyTokenAddress,
    sellTokenAddress,
    buyAmount,
    sellAmount,
    allowanceTarget,
    estimatedPriceImpact,
  } = action.payload.unvalidatedSwapTransaction
  const amountType =
    action.payload.userInput.updatedField === Field.TO
      ? ('buyAmount' as const)
      : ('sellAmount' as const)
  const amount = action.payload.unvalidatedSwapTransaction[amountType]
  const { quoteRequestAt, quoteResponseAt } = action.payload
  const quoteRequestElapsedTimeInMs = quoteResponseAt - quoteRequestAt

  const tokenBalances: TokenBalance[] = yield select(swappableTokensSelector)
  const fromToken = tokenBalances.find((token) => token.address === sellTokenAddress)
  const fromTokenBalance = fromToken
    ? fromToken.balance.shiftedBy(fromToken.decimals).toString()
    : ''

  const swapApproveContext = newTransactionContext(TAG, 'Swap/Approve')
  const swapExecuteContext = newTransactionContext(TAG, 'Swap/Execute')

  const defaultSwapExecuteProps = {
    toToken: buyTokenAddress,
    fromToken: sellTokenAddress,
    amount,
    amountType,
    price,
    allowanceTarget,
    estimatedPriceImpact,
    provider: action.payload.details.swapProvider,
    fromTokenBalance,
    swapExecuteTxId: swapExecuteContext.id,
    swapApproveTxId: swapApproveContext.id,
  }

  let sendApprovalElapsedTimeInMs: number | undefined
  let sendSwapElapsedTimeInMs: number | undefined
  let quoteToTransactionElapsedTimeInMs: number | undefined

  const getTimeMetrics = (finishTime: number): SwapTimeMetrics => ({
    quoteRequestTimestamp: quoteRequestAt,
    quoteRequestElapsedTimeInMs,
    sendApprovalElapsedTimeInMs,
    sendSwapElapsedTimeInMs,
    totalElapsedTimeInMs: finishTime - quoteRequestAt,
    quoteToTransactionElapsedTimeInMs,
  })

  try {
    // Navigate to swap pending screen
    yield call(navigate, Screens.SwapExecuteScreen)

    // Check that our guaranteedPrice is within 2%, maxSwapSlippagePercentage, of of the price
    const maxSlippagePercent: number = yield select(maxSwapSlippagePercentageSelector)

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

    const amountToApprove =
      amountType === 'buyAmount'
        ? valueToBigNumber(buyAmount).times(guaranteedPrice).toFixed(0, 0)
        : sellAmount

    // Approve transaction
    yield put(swapApprove())
    Logger.debug(
      TAG,
      `Approving ${amountToApprove} of ${sellTokenAddress} for address: ${allowanceTarget}`
    )
    const beforeApproveTimestamp = Date.now()
    yield call(
      sendApproveTx,
      sellTokenAddress,
      amountToApprove,
      allowanceTarget,
      swapApproveContext
    )
    const afterApproveTimestamp = Date.now()
    sendApprovalElapsedTimeInMs = afterApproveTimestamp - beforeApproveTimestamp

    // Execute transaction
    yield put(swapExecute())
    Logger.debug(TAG, `Starting to swap execute for address: ${walletAddress}`)

    const beforeSwapExecutionTimestamp = Date.now()
    yield call(
      handleSendSwapTransaction,
      { ...action.payload.unvalidatedSwapTransaction },
      swapExecuteContext
    )
    const afterSwapExecutionTimestamp = Date.now()
    sendSwapElapsedTimeInMs = afterSwapExecutionTimestamp - beforeSwapExecutionTimestamp
    quoteToTransactionElapsedTimeInMs = afterSwapExecutionTimestamp - quoteRequestAt

    const timeMetrics = getTimeMetrics(afterSwapExecutionTimestamp)

    yield put(swapSuccess())
    vibrateSuccess()
    ValoraAnalytics.track(SwapEvents.swap_execute_success, {
      ...defaultSwapExecuteProps,
      ...timeMetrics,
    })
  } catch (error) {
    const finishTime = Date.now()
    const timeMetrics = getTimeMetrics(finishTime)

    Logger.error(TAG, 'Error while swapping', error)
    ValoraAnalytics.track(SwapEvents.swap_execute_error, {
      ...defaultSwapExecuteProps,
      ...timeMetrics,
      error: error.message,
    })
    yield put(swapError())
    vibrateError()
  }
}

export function* swapSaga() {
  yield takeLatest(swapStart.type, safely(swapSubmitSaga))
}

export function* sendApproveTx(
  tokenAddress: string,
  amount: string,
  recipientAddress: string,
  transactionContext: TransactionContext
) {
  const kit: ContractKit = yield call(getContractKit)
  const contract: Contract = yield call(getERC20TokenContract, tokenAddress)
  const walletAddress: string = yield call(getConnectedUnlockedAccount)

  const tx: CeloTransactionObject<boolean> = toTransactionObject(
    kit.connection,
    contract.methods.approve(recipientAddress, amount)
  )

  yield call(sendTransaction, tx.txo, walletAddress, transactionContext)
}
