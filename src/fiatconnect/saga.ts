import { TransferResponse } from '@fiatconnect/fiatconnect-types'
import { call, put, select, spawn, takeEvery, takeLeading } from 'redux-saga/effects'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import {
  doTransferOut,
  fetchQuotes,
  FiatConnectQuoteError,
  FiatConnectQuoteSuccess,
} from 'src/fiatconnect'
import {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fiatConnectTransferFailed,
  startFiatConnectTransfer,
} from 'src/fiatconnect/slice'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { UserLocationData } from 'src/networkInfo/saga'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { sendPayment } from 'src/send/saga'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'FiatConnectSaga'

export function* handleFetchFiatConnectQuotes({
  payload: params,
}: ReturnType<typeof fetchFiatConnectQuotes>) {
  const { flow, digitalAsset, cryptoAmount } = params
  const userLocation: UserLocationData = yield select(userLocationDataSelector)
  const account: string = yield select(currentAccountSelector)!
  const localCurrency: LocalCurrencyCode = yield select(getLocalCurrencyCode)
  const fiatConnectCashInEnabled: boolean = yield select(fiatConnectCashInEnabledSelector)
  const fiatConnectCashOutEnabled: boolean = yield select(fiatConnectCashOutEnabledSelector)

  try {
    const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield call(fetchQuotes, {
      account,
      localCurrency,
      digitalAsset,
      cryptoAmount,
      country: userLocation?.countryCodeAlpha2 || 'US',
      flow,
      fiatConnectCashInEnabled,
      fiatConnectCashOutEnabled,
    })
    yield put(fetchFiatConnectQuotesCompleted({ quotes }))
  } catch (error) {
    Logger.error(TAG, 'Could not parse dapps response', error)
    yield put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch providers' }))
  }
}

export function* watchFetchFiatConnectQuotes() {
  yield takeLeading(fetchFiatConnectQuotes.type, handleFetchFiatConnectQuotes)
}

function* handleStartFiatConnectTransfer({
  payload: params,
}: ReturnType<typeof startFiatConnectTransfer>) {
  const { flow, quoteId, fiatConnectQuote, fiatAccountId } = params

  if (flow === CICOFlow.CashOut) {
    try {
      Logger.info(TAG, 'Starting transfer out..')
      const transferResult: TransferResponse = yield call(
        doTransferOut,
        fiatConnectQuote,
        fiatAccountId
      )

      Logger.info(
        TAG,
        'Transfer out $succeeded. Starting transaction..',
        JSON.stringify(transferResult)
      )

      yield call(sendPayment, transferResult.transferAddress)
    } catch (err) {
      Logger.error(TAG, 'Transfer out failed..', err)
      yield put(fiatConnectTransferFailed({ flow, quoteId }))
    }
  } else {
    throw new Error('not implemented')
  }

  yield
}

function* watchFiatConnectTransactions() {
  yield takeEvery(startFiatConnectTransfer.type, handleStartFiatConnectTransfer)
}

export function* fiatConnectSaga() {
  yield spawn(watchFetchFiatConnectQuotes)
  yield spawn(watchFiatConnectTransactions)
}
