import BigNumber from 'bignumber.js'
import { Actions as AccountActions } from 'src/account/actions'
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
import { gql } from 'src/utils/gql'
import { safely } from 'src/utils/safely'
import networkConfig from 'src/web3/networkConfig'
import { call, put, select, spawn, take, takeLatest } from 'typed-redux-saga'

const TAG = 'localCurrency/saga'

interface ExchangeRateQueryVariables {
  currencyCode: string
  sourceCurrencyCode?: string | null
}

interface ExchangeRateQuery {
  currencyConversion: { rate: BigNumber.Value } | null
}

export async function fetchExchangeRate(
  sourceCurrency: string,
  localCurrencyCode: string
): Promise<string> {
  const response = await fetch(`${networkConfig.blockchainApiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
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
      } satisfies ExchangeRateQueryVariables,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rate: ${response.status} ${response.statusText}`)
  }

  const body = (await response.json()) as { data: ExchangeRateQuery | undefined }

  const rate = body.data?.currencyConversion?.rate
  if (typeof rate !== 'number' && typeof rate !== 'string') {
    throw new Error(`Invalid response data ${body.data}`)
  }

  const fetchedExchangeRate = new BigNumber(rate).toString()
  Logger.info(
    TAG,
    `Fetched exchange rate for ${sourceCurrency} -> ${localCurrencyCode}: ${fetchedExchangeRate}`
  )
  return fetchedExchangeRate
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
