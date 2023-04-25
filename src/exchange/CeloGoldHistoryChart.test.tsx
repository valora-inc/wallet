import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import CeloGoldHistoryChart from 'src/exchange/CeloGoldHistoryChart'
import { ExchangeRates } from 'src/exchange/reducer'
import { createMockStore, getMockI18nProps } from 'test/utils'
import {
  exchangePriceHistory,
  makeExchangeRates,
  mockCeloAddress,
  mockTokenBalances,
} from 'test/values'

const SAMPLE_BALANCE = '55.00001'
const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

it('renders without history', () => {
  const tree = render(
    <Provider
      store={createMockStore({
        exchange: { exchangeRates },
        tokens: {
          tokenBalances: {
            [mockCeloAddress]: {
              ...mockTokenBalances[mockCeloAddress],
              balance: SAMPLE_BALANCE,
            },
          },
        },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders while update is in progress', () => {
  const localExchangeRatePriceHistory = { ...exchangePriceHistory }
  const endDate = new Date('01/01/2020').getTime()
  localExchangeRatePriceHistory.lastTimeUpdated = 0
  localExchangeRatePriceHistory.celoGoldExchangeRates = [
    {
      exchangeRate: '0.123',
      timestamp: endDate,
    },
  ]
  localExchangeRatePriceHistory.aggregatedExchangeRates = [
    {
      exchangeRate: '0.123',
      timestamp: endDate,
    },
  ]

  const tree = render(
    <Provider
      store={createMockStore({
        exchange: {
          exchangeRates,
          history: localExchangeRatePriceHistory,
        },
        tokens: {
          tokenBalances: {
            [mockCeloAddress]: {
              ...mockTokenBalances[mockCeloAddress],
              balance: SAMPLE_BALANCE,
            },
          },
        },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders properly', () => {
  const tree = render(
    <Provider
      store={createMockStore({
        exchange: {
          exchangeRates,
          history: exchangePriceHistory,
        },
        tokens: {
          tokenBalances: {
            [mockCeloAddress]: {
              ...mockTokenBalances[mockCeloAddress],
              balance: SAMPLE_BALANCE,
            },
          },
        },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
