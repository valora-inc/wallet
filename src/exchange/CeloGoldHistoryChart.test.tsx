import { render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import CeloGoldHistoryChart from 'src/exchange/CeloGoldHistoryChart'
import { ExchangeRates } from 'src/exchange/reducer'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { makeExchangeRates } from 'test/values'

const SAMPLE_BALANCE = '55.00001'
const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

const endDate = new Date('01/01/2020').getTime()

it('renders without history', () => {
  const tree = render(
    <Provider
      store={createMockStore({
        exchange: { exchangeRates },
        goldToken: { balance: SAMPLE_BALANCE },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders while update is in progress', () => {
  const tree = render(
    <Provider
      store={createMockStore({
        exchange: {
          exchangeRates,
          history: {
            celoGoldExchangeRates: [
              {
                exchangeRate: '0.123',
                timestamp: endDate,
              },
            ],
            aggregatedExchangeRates: [
              {
                exchangeRate: '0.123',
                timestamp: endDate,
              },
            ],
            granularity: 60,
            range: 30 * 24 * 60 * 60 * 1000, // 30 days
            lastTimeUpdated: 0,
          },
        },
        goldToken: { balance: SAMPLE_BALANCE },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders properly', () => {
  const celoGoldExchangeRates = _.range(60).map((i) => ({
    exchangeRate: (i / 60).toString(),
    timestamp: endDate - i * 24 * 3600 * 1000,
  }))
  const tree = render(
    <Provider
      store={createMockStore({
        exchange: {
          exchangeRates,
          history: {
            celoGoldExchangeRates,
            aggregatedExchangeRates: celoGoldExchangeRates,
            lastTimeUpdated: endDate,
            granularity: 60,
            range: 30 * 24 * 60 * 60 * 1000, // 30 days
          },
        },
        goldToken: { balance: SAMPLE_BALANCE },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
