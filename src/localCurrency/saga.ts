import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import { Actions as AccountActions } from 'src/account/actions'
import { apolloClient } from 'src/apollo'
import { ExchangeRateQuery, ExchangeRateQueryVariables } from 'src/apollo/types'
import { Actions as AppActions } from 'src/app/actions'
import {
  Actions,
  fetchCurrentRate,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
} from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { call, put, select, spawn, take, takeLatest } from 'typed-redux-saga'

const TAG = 'localCurrency/saga'

export async function fetchExchangeRate(
  sourceCurrency: string,
  localCurrencyCode: string
): Promise<string> {
  const response = await apolloClient.query<ExchangeRateQuery, ExchangeRateQueryVariables>({
    query: gql`
      query ExchangeRate($currencyCode: String!, $sourceCurrencyCode: String) {
        currencyConversion(currencyCode: $currencyCode, sourceCurrencyCode: $sourceCurrencyCode) {
          rate
        }
      }
    `,
    variables: {
      currencyCode: localCurrencyCode,
      sourceCurrencyCode: sourceCurrency,
    },
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  })

  const rate = response.data.currencyConversion?.rate
  if (typeof rate !== 'number' && typeof rate !== 'string') {
    throw new Error(`Invalid response data ${response.data}`)
  }

  return new BigNumber(rate).toString()
}

// @ts-ignore return type issue, couldn't figure it out
export function* fetchLocalCurrencyRateSaga() {
  try {
    const localCurrencyCode: LocalCurrencyCode | null = yield* select(getLocalCurrencyCode)
    if (!localCurrencyCode) {
      throw new Error("Can't fetch local currency rate without a currency code")
    }
    const usdToLocalRate = yield* call(fetchExchangeRate, LocalCurrencyCode.USD, localCurrencyCode)
    yield* put(fetchCurrentRateSuccess(localCurrencyCode, usdToLocalRate, Date.now()))
  } catch (error) {
    Logger.error(`${TAG}@fetchLocalCurrencyRateSaga`, 'Failed to fetch local currency rate', error)
    yield* put(fetchCurrentRateFailure())
  }
}

export function* watchFetchCurrentRate() {
  yield* takeLatest(Actions.FETCH_CURRENT_RATE, safely(fetchLocalCurrencyRateSaga))
}

export function* watchSelectPreferredCurrency() {
  yield* put(fetchCurrentRate())
  while (true) {
    yield* take([
      Actions.SELECT_PREFERRED_CURRENCY,
      AccountActions.SET_PHONE_NUMBER,
      AppActions.PHONE_NUMBER_VERIFICATION_COMPLETED,
    ])
    yield* put(fetchCurrentRate())
  }
}

export function* localCurrencySaga() {
  yield* spawn(watchFetchCurrentRate)
  yield* spawn(watchSelectPreferredCurrency)
}
