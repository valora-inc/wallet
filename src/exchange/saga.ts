import { CeloTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, takeEvery } from 'redux-saga/effects'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  WithdrawCeloAction,
  withdrawCeloCanceled,
  withdrawCeloFailed,
  withdrawCeloSuccess,
} from 'src/exchange/actions'
import { ExchangeRates, exchangeRatesSelector } from 'src/exchange/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { sendPaymentSuccess } from 'src/send/actions'
import { createTokenTransferTransaction } from 'src/tokens/saga'
import { celoAddressSelector } from 'src/tokens/selectors'
import { addStandbyTransaction, addStandbyTransactionLegacy } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import {
  newTransactionContext,
  TokenTransactionTypeV2,
  TransactionContext,
  TransactionStatus,
} from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getRateForMakerToken, goldToDollarAmount } from 'src/utils/currencyExchange'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'exchange/saga'

function* celoToDollarAmount(amount: BigNumber) {
  const exchangeRates: ExchangeRates = yield select(exchangeRatesSelector)
  const exchangeRate = getRateForMakerToken(exchangeRates, Currency.Dollar, Currency.Celo)
  return goldToDollarAmount(amount, exchangeRate) || new BigNumber(0)
}

export function* withdrawCelo(action: WithdrawCeloAction) {
  let context: TransactionContext | null = null
  try {
    const { recipientAddress, amount } = action
    const account: string = yield call(getConnectedUnlockedAccount)

    navigate(Screens.WalletHome)

    context = newTransactionContext(TAG, 'Withdraw CELO')
    yield put(
      addStandbyTransactionLegacy({
        context,
        type: TokenTransactionType.Sent,
        comment: '',
        status: TransactionStatus.Pending,
        value: amount.toString(),
        currency: Currency.Celo,
        timestamp: Math.floor(Date.now() / 1000),
        address: recipientAddress,
      })
    )

    const celoTokenAddress: string = yield select(celoAddressSelector)
    yield put(
      addStandbyTransaction({
        context,
        type: TokenTransactionTypeV2.Sent,
        comment: '',
        status: TransactionStatus.Pending,
        value: amount.toString(),
        tokenAddress: celoTokenAddress,
        timestamp: Math.floor(Date.now() / 1000),
        address: recipientAddress,
      })
    )

    const tx: CeloTransactionObject<boolean> = yield call(
      createTokenTransferTransaction,
      celoTokenAddress,
      {
        recipientAddress,
        amount,
        comment: '',
      }
    )

    yield call(sendAndMonitorTransaction, tx, account, context)

    const dollarAmount = yield call(celoToDollarAmount, amount)
    yield put(sendPaymentSuccess(dollarAmount))

    yield put(withdrawCeloSuccess())

    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_completed, {
      amount: amount.toString(),
    })
  } catch (error) {
    if (error.message === ErrorMessages.PIN_INPUT_CANCELED) {
      yield put(withdrawCeloCanceled())
      return
    }

    Logger.error(TAG, 'Error withdrawing CELO', error)
    const errorToShow =
      error.message === ErrorMessages.INCORRECT_PIN
        ? ErrorMessages.INCORRECT_PIN
        : ErrorMessages.TRANSACTION_FAILED
    yield put(withdrawCeloFailed(context?.id, errorToShow))

    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_error, {
      error,
    })
  }
}

export function* watchWithdrawCelo() {
  yield takeEvery(Actions.WITHDRAW_CELO, safely(withdrawCelo))
}

export function* exchangeSaga() {
  yield spawn(watchWithdrawCelo)
}
