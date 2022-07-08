import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { fetchQuotes, FiatConnectQuoteError, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
} from 'src/fiatconnect/slice'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { UserLocationData } from 'src/networkInfo/saga'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
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

export function* fiatConnectSaga() {
  yield spawn(watchFetchFiatConnectQuotes)
}
