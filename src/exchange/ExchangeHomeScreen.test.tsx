import { render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import { ExchangeRates } from 'src/exchange/reducer'
import { createMockStore } from 'test/utils'
import {
  exchangePriceHistory,
  makeExchangeRates,
  mockCeloAddress,
  mockCusdAddress,
  mockTokenBalances,
} from 'test/values'

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        ...mockTokenBalances[mockCusdAddress],
        balance: '10',
      },
      [mockCeloAddress]: {
        ...mockTokenBalances[mockCeloAddress],
        balance: '2',
      },
      [mockCeloAddress]: {
        ...mockTokenBalances[mockCeloAddress],
        balance: '2',
      },
    },
  },
  exchange: {
    exchangeRates,
    history: exchangePriceHistory,
  },
  app: { celoNews: { enabled: true } },
})

describe('ExchangeHomeScreen', () => {
  it('renders the price chart', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeHomeScreen />
      </Provider>
    )

    // Check we can see the price chart
    expect(getByTestId('PriceChart')).toBeTruthy()
  })

  it('renders the price in header', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeHomeScreen />
      </Provider>
    )

    // Check we can see the price and price change in the header
    const headerMiddleElement = getByTestId('Header')
    expect(within(headerMiddleElement).getByTestId('CeloPriceInLocalCurrency')).toBeTruthy()
  })

  it('renders the Celo news feed when enabled', async () => {
    const tree = render(
      <Provider store={store}>
        <ExchangeHomeScreen />
      </Provider>
    )

    // Check we can see the Celo news header
    expect(tree.queryByText('celoNews.headerTitle')).toBeTruthy()
  })
})
