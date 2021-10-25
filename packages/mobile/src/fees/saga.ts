import BigNumber from 'bignumber.js'
import { call, CallEffect, put, select, takeLatest } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { FeeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getEscrowTxGas, getReclaimEscrowGas } from 'src/escrow/saga'
import { Actions, EstimateFeeAction, feeEstimated, FeeType } from 'src/fees/actions'
import { getSendTxGas } from 'src/send/saga'
import { cUsdBalanceSelector } from 'src/stableToken/selectors'
import { BasicTokenTransfer } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getGasPrice } from 'src/web3/gas'
import { getConnectedAccount } from 'src/web3/saga'

const TAG = 'fees/saga'

export interface FeeInfo {
  fee: BigNumber
  gas: BigNumber
  gasPrice: BigNumber
  currency: Currency
}

// TODO(victor): This fee caching mechansim is only being used by the balance check on the send
// amount entry screen. In an effort to standardize and improve fee estimation, we should either
// update and use this mechanism everywhere or remove it in favor of another solution.
// Cache of the gas estimates for common tx types
// Prevents us from having to recreate txs and estimate their gas each time
const feeGasCache = new Map<FeeType, BigNumber>()

// Just use default values here since it doesn't matter for fee estimation
const placeHolderAddress = `0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10`
const placeholderSendTx: BasicTokenTransfer = {
  recipientAddress: placeHolderAddress,
  amount: 1e-18, // 1 wei
  comment: 'Coffee or Tea?',
}

export function* estimateFeeSaga({ feeType }: EstimateFeeAction) {
  Logger.debug(`${TAG}/estimateFeeSaga`, `updating for ${feeType}`)

  const balance = yield select(cUsdBalanceSelector)

  if (!balance) {
    Logger.warn(`${TAG}/estimateFeeSaga`, 'Balance is null or empty string')
    yield put(feeEstimated(feeType, '0'))
    return
  }

  if (balance === '0') {
    Logger.warn(`${TAG}/estimateFeeSaga`, "Can't estimate fee with zero balance")
    yield put(feeEstimated(feeType, '0'))
    return
  }

  Logger.debug(`${TAG}/estimateFeeSaga`, `balance is ${balance}`)

  try {
    const account = yield call(getConnectedAccount)

    let feeInWei: BigNumber | null = null

    switch (feeType) {
      case FeeType.INVITE:
        feeInWei = yield call(getOrSetFee, FeeType.INVITE, call(getEscrowTxGas))
        break
      case FeeType.SEND:
        feeInWei = yield call(
          getOrSetFee,
          FeeType.SEND,
          call(getSendTxGas, account, Currency.Dollar, placeholderSendTx)
        )
        break
      case FeeType.EXCHANGE:
        // TODO
        break
      case FeeType.RECLAIM_ESCROW:
        feeInWei = yield call(
          getOrSetFee,
          FeeType.RECLAIM_ESCROW,
          call(getReclaimEscrowGas, account, placeHolderAddress)
        )
        break
    }

    if (feeInWei) {
      Logger.debug(`${TAG}/estimateFeeSaga`, `New fee is: ${feeInWei}`)
      yield put(feeEstimated(feeType, feeInWei.toString()))
    }
  } catch (error) {
    Logger.error(`${TAG}/estimateFeeSaga`, 'Error estimating fee', error)
    ValoraAnalytics.track(FeeEvents.estimate_fee_failed, { error: error.message, feeType })
    yield put(showErrorOrFallback(error, ErrorMessages.CALCULATE_FEE_FAILED))
  }
}

function* getOrSetFee(feeType: FeeType, gasGetter: CallEffect) {
  if (!feeGasCache.get(feeType)) {
    const gas: BigNumber = yield gasGetter
    feeGasCache.set(feeType, gas)
  }
  // Note: This code path only supports cUSD fees. It is not the most widely used version of fee
  // estimation, and should be refactored or removed.
  const feeInfo: FeeInfo = yield call(calculateFee, feeGasCache.get(feeType)!, Currency.Dollar)
  return feeInfo.fee
}

export async function calculateFee(gas: BigNumber, currency: Currency): Promise<FeeInfo> {
  const gasPrice = await getGasPrice(currency)
  const feeInWei = gas.multipliedBy(gasPrice)
  Logger.debug(`${TAG}/calculateFee`, `Calculated ${currency} fee is: ${feeInWei.toString()}`)
  return { gas, currency, gasPrice, fee: feeInWei }
}

export function* feesSaga() {
  yield takeLatest(Actions.ESTIMATE_FEE, estimateFeeSaga)
}
