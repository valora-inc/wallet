import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import { call, put, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { Actions as AccountActions } from 'src/account/actions'
import { apolloClient } from 'src/apollo'
import { ExchangeRateQuery, ExchangeRateQueryVariables } from 'src/apollo/types'
import {
  Actions,
  fetchCurrentRate,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
} from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

const TAG = 'localCurrency/saga'

export async function fetchExchangeRate(
  localCurrencyCode: string,
  baseCurrency: Currency
): Promise<string> {
  const response = await apolloClient.query<ExchangeRateQuery, ExchangeRateQueryVariables>({
    query: gql`
      query ExchangeRate($currencyCode: String!) {
        currencyConversion(currencyCode: $currencyCode) {
          rate
        }
      }
    `,
    variables: { currencyCode: localCurrencyCode },
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  })

  const rate = response.data.currencyConversion?.rate
  console.log('ZXCZXCZXCZXC2', response.data)
  if (typeof rate !== 'number' && typeof rate !== 'string') {
    throw new Error(`Invalid response data ${response.data}`)
  }

  return new BigNumber(rate).toString()
}

export function* fetchLocalCurrencyRateSaga() {
  try {
    const localCurrencyCode: LocalCurrencyCode | null = yield select(getLocalCurrencyCode)
    if (!localCurrencyCode) {
      throw new Error("Can't fetch local currency rate without a currency code")
    }
    const usdRate = yield call(fetchExchangeRate, localCurrencyCode, Currency.Dollar)
    const euroRate = yield call(fetchExchangeRate, localCurrencyCode, Currency.Euro)
    yield put(fetchCurrentRateSuccess(localCurrencyCode, usdRate, euroRate, Date.now()))
  } catch (error) {
    Logger.error(`${TAG}@fetchLocalCurrencyRateSaga`, error)
    yield put(fetchCurrentRateFailure())
  }
}

export function* watchFetchCurrentRate() {
  yield takeLatest(Actions.FETCH_CURRENT_RATE, fetchLocalCurrencyRateSaga)
}

export function* watchSelectPreferredCurrency() {
  yield put(fetchCurrentRate())
  while (true) {
    yield take([Actions.SELECT_PREFERRED_CURRENCY, AccountActions.SET_PHONE_NUMBER])
    yield put(fetchCurrentRate())
  }
}

export function* localCurrencySaga() {
  yield spawn(watchFetchCurrentRate)
  yield spawn(watchSelectPreferredCurrency)
}
