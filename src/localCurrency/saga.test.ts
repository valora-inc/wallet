import { FetchMock } from 'jest-fetch-mock'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import {
  fetchCurrentRate,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
  selectPreferredCurrency,
} from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  fetchExchangeRate,
  watchFetchCurrentRate,
  watchSelectPreferredCurrency,
} from 'src/localCurrency/saga'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'

const now = Date.now()
Date.now = jest.fn(() => now)
const mockFetch = fetch as FetchMock

describe(watchFetchCurrentRate, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the local currency rate and dispatches the success action', async () => {
    await expectSaga(watchFetchCurrentRate)
      .provide([
        [select(getLocalCurrencyCode), LocalCurrencyCode.PHP],
        [call(fetchExchangeRate, LocalCurrencyCode.USD, LocalCurrencyCode.PHP), '1.33'],
      ])
      .put(fetchCurrentRateSuccess(LocalCurrencyCode.PHP, '1.33', now))
      .dispatch(fetchCurrentRate())
      .run()
  })

  it('fetches the local currency rate and dispatches the failure action when it fails', async () => {
    await expectSaga(watchFetchCurrentRate)
      .provide([
        [select(getLocalCurrencyCode), LocalCurrencyCode.PHP],
        [matchers.call.fn(fetchExchangeRate), throwError(new Error('test error'))],
      ])
      .put(fetchCurrentRateFailure())
      .dispatch(fetchCurrentRate())
      .run()
  })
})

describe(watchSelectPreferredCurrency, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the local currency rate when the preferred currency changes', async () => {
    await expectSaga(watchSelectPreferredCurrency)
      .put(fetchCurrentRate())
      .dispatch(selectPreferredCurrency(LocalCurrencyCode.PHP))
      .run()
  })
})

describe(fetchExchangeRate, () => {
  it('does not fetch when the local currency code is the same as source currency code', async () => {
    await fetchExchangeRate(LocalCurrencyCode.USD, LocalCurrencyCode.USD)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches the exchange rate and returns it', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ data: { currencyConversion: { rate: 1.33 } } }))
    await fetchExchangeRate(LocalCurrencyCode.PHP, LocalCurrencyCode.USD)
    expect(mockFetch).toHaveBeenCalled()
  })
})
