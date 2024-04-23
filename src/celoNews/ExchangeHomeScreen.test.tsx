import { render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ExchangeHomeScreen from 'src/celoNews/ExchangeHomeScreen'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId, mockCusdTokenId, mockTokenBalances, priceHistory } from 'test/values'

jest.mock('src/statsig')

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: mockTokenBalances[mockCusdTokenId],
      [mockCeloTokenId]: mockTokenBalances[mockCeloTokenId],
    },
  },
  priceHistory: {
    [mockCeloTokenId]: priceHistory,
  },
})

describe('ExchangeHomeScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders the price chart using PriceHistoryChart and blockchain api', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeHomeScreen />
      </Provider>
    )

    // Check we can see the price chart
    expect(getByTestId(`CeloNews/Chart/${mockCeloTokenId}`)).toBeTruthy()
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
