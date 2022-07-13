import { Result } from '@badrap/result'
import { FiatConnectApiClient, ResponseError } from '@fiatconnect/fiatconnect-sdk'
import { ObfuscatedFiatAccountData } from '@fiatconnect/fiatconnect-types'
import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { fetchQuotes, FiatConnectQuoteError, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { fiatConnectQuotesSelector } from 'src/fiatconnect/selectors'
import {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fetchQuoteAndFiatAccount,
  fetchQuoteAndFiatAccountCompleted,
  fetchQuoteAndFiatAccountFailed,
  fiatAccountRemove,
} from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { quoteHasErrors } from 'src/fiatExchanges/quotes/normalizeQuotes'
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
  const { flow, digitalAsset, cryptoAmount, providerIds } = params
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
      providerList: providerIds,
    })
    yield put(fetchFiatConnectQuotesCompleted({ quotes }))
  } catch (error) {
    yield put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch providers' }))
  }
}

export function* handleFetchQuoteAndFiatAccount({
  payload: params,
}: ReturnType<typeof fetchQuoteAndFiatAccount>) {
  const { flow, digitalAsset, cryptoAmount, providerId, fiatAccountId, fiatAccountType } = params

  try {
    Logger.info(TAG, `Fetching quote for ${providerId}`)
    yield put(
      fetchFiatConnectQuotes({
        flow,
        digitalAsset,
        cryptoAmount,
        providerIds: [providerId],
      })
    )
    const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield select(
      fiatConnectQuotesSelector
    )
    if (quoteHasErrors(quotes[0])) {
      throw new Error(`Quote has errors: ${quotes[0].error}`)
    }
    const normalizedQuote = new FiatConnectQuote({
      quote: quotes[0],
      fiatAccountType,
      flow,
    })
    const fiatConnectClient: FiatConnectApiClient = yield call(normalizedQuote.getFiatConnectClient)

    Logger.info(TAG, `Fetching fiatAccounts for ${providerId}`)
    const fiatAccountsResponse: Result<ObfuscatedFiatAccountData[], ResponseError> = yield call(
      fiatConnectClient.getFiatAccounts
    )
    if (fiatAccountsResponse.isErr) {
      throw new Error(`FiatAccount has errors: ${fiatAccountsResponse.error.message}`)
    }
    const fiatAccount = fiatAccountsResponse.value.find(
      (account) => account.fiatAccountId === fiatAccountId
    )
    if (!fiatAccount) {
      // If the fiatAccountId we have saved does not match any the provider has, then it must have been deleted.
      // In that case, remove it from our redux state.
      yield put(fiatAccountRemove({ providerId, fiatAccountId, fiatAccountType }))
      throw new Error(
        `Error: FiatAccount not found. fiatAccountId: ${fiatAccountId}, providerId: ${providerId}`
      )
    }
    yield put(fetchQuoteAndFiatAccountCompleted({ fiatAccount }))
  } catch (error) {
    Logger.debug(TAG, 'Fetching Quote and FiatAccount failed...', error)
    yield put(
      fetchQuoteAndFiatAccountFailed({
        error: `handleFetchQuoteAndFiatAccount failed. ${error.message}`,
      })
    )
  }
}

export function* watchFetchFiatConnectQuotes() {
  yield takeLeading(fetchFiatConnectQuotes.type, handleFetchFiatConnectQuotes)
}

export function* watchFetchQuoteAndFiatAccount() {
  yield takeLeading(fetchQuoteAndFiatAccount.type, handleFetchQuoteAndFiatAccount)
}

export function* fiatConnectSaga() {
  yield spawn(watchFetchFiatConnectQuotes)
  yield spawn(watchFetchQuoteAndFiatAccount)
}
