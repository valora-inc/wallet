import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import PriceHistoryChart from 'src/priceHistory/PriceHistoryChart'
import { Price } from 'src/priceHistory/slice'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId } from 'test/values'

const mockPrices = [
  {
    priceFetchedAt: 1700378258000,
    priceUsd: '0.97',
  },
  {
    priceFetchedAt: 1701659858000,
    priceUsd: '1.2',
  },
  {
    priceFetchedAt: 1702941458000,
    priceUsd: '1.4',
  },
] as Price[]

it('renders loading icon while no data found and loading', () => {
  const { getByTestId } = render(
    <Provider
      store={createMockStore({
        priceHistory: {
          [mockCeloTokenId]: {
            status: 'loading',
          },
        },
      })}
    >
      <PriceHistoryChart tokenId={mockCeloTokenId} />
    </Provider>
  )
  expect(getByTestId('PriceHistoryChart/Loader')).toBeTruthy()
})

it('renders while update is in progress', () => {
  const tree = render(
    <Provider
      store={createMockStore({
        priceHistory: {
          [mockCeloTokenId]: {
            status: 'loading',
            prices: mockPrices,
          },
        },
      })}
    >
      <PriceHistoryChart tokenId={mockCeloTokenId} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders with history', () => {
  const tree = render(
    <Provider
      store={createMockStore({
        priceHistory: {
          [mockCeloTokenId]: {
            status: 'success',
            prices: mockPrices,
          },
        },
      })}
    >
      <PriceHistoryChart tokenId={mockCeloTokenId} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
