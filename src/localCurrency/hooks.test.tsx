import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { MoneyAmount } from 'src/apollo/types'
import * as localCurrencyHooks from 'src/localCurrency/hooks'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

const useLocalCurrencyToShowSpy = jest.spyOn(localCurrencyHooks, 'useLocalCurrencyToShow')

function TestComponent({ amount }: { amount: MoneyAmount }) {
  localCurrencyHooks.useLocalCurrencyToShow(amount)

  return null
}

function createStore(dollarExchange: string | null = '2') {
  return createMockStore({
    tokens: {
      tokenBalances: {
        '0xcUSD': {
          symbol: 'cUSD',
          balance: '0',
          usdPrice: '1',
          priceFetchedAt: Date.now(),
        },
        '0xCELO': {
          symbol: 'CELO',
          balance: '0',
          usdPrice: '5',
          priceFetchedAt: Date.now(),
        },
        '0xT1': {
          symbol: 'T1',
          balance: '0',
          usdPrice: '5',
          priceFetchedAt: Date.now(),
        },
        '0xT2': {
          symbol: 'T2',
          usdPrice: '5',
          balance: null,
          priceFetchedAt: Date.now(),
        },
      },
    },
    localCurrency: {
      exchangeRates: {
        [Currency.Dollar]: dollarExchange,
      },
    },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe(localCurrencyHooks.useLocalCurrencyToShow, () => {
  it('returns the expected values when the currency is known', async () => {
    render(
      <Provider store={createStore()}>
        <TestComponent amount={{ value: 15, currencyCode: 'cUSD' }} />
      </Provider>
    )

    expect(useLocalCurrencyToShowSpy).toHaveReturnedTimes(1)
    expect(useLocalCurrencyToShowSpy).toHaveReturnedWith({
      amountCurrency: 'cUSD',
      localCurrencyCode: 'PHP',
      localCurrencyExchangeRate: '2',
    })
  })

  // Special case for CELO because of the cGLD symbol/enum value used historically
  it('returns the expected values when the currency is CELO', async () => {
    render(
      <Provider store={createStore()}>
        <TestComponent amount={{ value: 15, currencyCode: Currency.Celo }} />
      </Provider>
    )

    expect(useLocalCurrencyToShowSpy).toHaveReturnedTimes(1)
    expect(useLocalCurrencyToShowSpy).toHaveReturnedWith({
      amountCurrency: 'cGLD',
      localCurrencyCode: 'PHP',
      localCurrencyExchangeRate: '10',
    })
  })

  it('returns the expected values when the currency is unknown', async () => {
    render(
      <Provider store={createStore()}>
        <TestComponent amount={{ value: 15, currencyCode: 'cSomething' }} />
      </Provider>
    )

    expect(useLocalCurrencyToShowSpy).toHaveReturnedTimes(1)
    expect(useLocalCurrencyToShowSpy).toHaveReturnedWith({
      amountCurrency: 'cSomething',
      localCurrencyCode: 'PHP',
      localCurrencyExchangeRate: null,
    })
  })

  it('returns the expected values when the token is known', async () => {
    render(
      <Provider store={createStore()}>
        <TestComponent amount={{ value: 15, currencyCode: 'T1' }} />
      </Provider>
    )

    expect(useLocalCurrencyToShowSpy).toHaveReturnedTimes(1)
    expect(useLocalCurrencyToShowSpy).toHaveReturnedWith({
      amountCurrency: 'T1',
      localCurrencyCode: 'PHP',
      localCurrencyExchangeRate: '10',
    })
  })

  it('returns the expected values when the token is unknown', async () => {
    render(
      <Provider store={createStore()}>
        <TestComponent amount={{ value: 15, currencyCode: 'SOMETHING' }} />
      </Provider>
    )

    expect(useLocalCurrencyToShowSpy).toHaveReturnedTimes(1)
    expect(useLocalCurrencyToShowSpy).toHaveReturnedWith({
      amountCurrency: 'SOMETHING',
      localCurrencyCode: 'PHP',
      localCurrencyExchangeRate: null,
    })
  })
})
