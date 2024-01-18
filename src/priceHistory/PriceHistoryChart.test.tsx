import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import PriceHistoryChart, { createChartData } from 'src/priceHistory/PriceHistoryChart'
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

describe('PriceHistoryChart', () => {
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
})

describe('createChartData', () => {
  const mockDollarsToLocal = jest.fn()
  const mockDisplayLocalCurrency = jest.fn()
  const mockStep = 1

  beforeEach(() => {
    mockDollarsToLocal.mockReset().mockImplementation((amount) => new BigNumber(amount))
    mockDisplayLocalCurrency.mockReset().mockImplementation((amount) => `$${amount.toString()}`)
  })

  it('should handle empty price history', () => {
    const result = createChartData([], mockStep, mockDollarsToLocal, mockDisplayLocalCurrency)
    expect(result).toEqual([])
  })

  it('should include high and low prices in the chart data', () => {
    const highPrice = {
      priceFetchedAt: 1704223058000,
      priceUsd: '11',
    }
    const lowPrice = {
      priceFetchedAt: 1705504658000,
      priceUsd: '.01',
    }
    const pricesWithHighAndLow = [...mockPrices, highPrice, lowPrice]
    const result = createChartData(
      pricesWithHighAndLow,
      mockStep,
      mockDollarsToLocal,
      mockDisplayLocalCurrency
    )
    expect(result).toStrictEqual([
      {
        amount: 0.97,
        displayValue: '$0.97',
        priceFetchedAt: 1700378258000,
      },
      { amount: 1.2, displayValue: '$1.2', priceFetchedAt: 1701659858000 },
      { amount: 1.4, displayValue: '$1.4', priceFetchedAt: 1702941458000 },
      { amount: 11, displayValue: '$11', priceFetchedAt: 1704223058000 },
      {
        amount: 0.01,
        displayValue: '$0.01',
        priceFetchedAt: 1705504658000,
      },
    ])
  })

  it('should always include the last price in the chart data', () => {
    const lastPrice = {
      priceFetchedAt: mockPrices[mockPrices.length - 1].priceFetchedAt + 1,
      priceUsd: '1.5',
    }
    const pricesWithRecent = [...mockPrices, lastPrice]
    const result = createChartData(
      pricesWithRecent,
      mockStep,
      mockDollarsToLocal,
      mockDisplayLocalCurrency
    )
    expect(result.length).toEqual(4)
    expect(result.at(-1)).toStrictEqual({
      amount: 1.5,
      displayValue: '$1.5',
      priceFetchedAt: lastPrice.priceFetchedAt,
    })
  })

  it('should remove duplicate prices', () => {
    const duplicatePrices = [...mockPrices, ...mockPrices]
    const result = createChartData(
      duplicatePrices,
      mockStep,
      mockDollarsToLocal,
      mockDisplayLocalCurrency
    )
    expect(result.length).toEqual(3)
    expect([...new Set(result.map((p) => p.priceFetchedAt))]).toEqual(
      mockPrices.map((p) => p.priceFetchedAt)
    )
  })

  it('should include the first price if it is the only price', () => {
    const result = createChartData(
      [mockPrices[0]],
      mockStep,
      mockDollarsToLocal,
      mockDisplayLocalCurrency
    )
    expect(result.length).toEqual(1)
    expect(result[0]).toEqual({
      amount: 0.97,
      displayValue: '$0.97',
      priceFetchedAt: 1700378258000,
    })
  })

  it('should handle different currency', () => {
    mockDollarsToLocal.mockImplementation((amount) => new BigNumber(amount * 2))
    mockDisplayLocalCurrency.mockImplementation((amount) => `€${amount.toString()}`)

    const result = createChartData(
      mockPrices,
      mockStep,
      mockDollarsToLocal,
      mockDisplayLocalCurrency
    )
    expect(mockDollarsToLocal).toHaveBeenCalled()
    expect(mockDisplayLocalCurrency).toHaveBeenCalled()
    expect(result).toStrictEqual([
      {
        amount: 1.94,
        displayValue: '€1.94',
        priceFetchedAt: 1700378258000,
      },
      { amount: 2.4, displayValue: '€2.4', priceFetchedAt: 1701659858000 },
      { amount: 2.8, displayValue: '€2.8', priceFetchedAt: 1702941458000 },
    ])
  })
})
