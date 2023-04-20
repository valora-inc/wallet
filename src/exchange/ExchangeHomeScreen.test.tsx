import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import { ExchangeRates } from 'src/exchange/reducer'
import { createMockStore } from 'test/utils'
import { makeExchangeRates, mockCeloAddress, mockCusdAddress, mockTokenBalances } from 'test/values'

// Mock this for now, as we get apollo issues
jest.mock('src/transactions/TransactionsList', () => 'TransactionsList')

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

describe('ExchangeHomeScreen', () => {
  it('renders the Celo news feed when enabled', async () => {
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
      exchange: { exchangeRates },
      app: { celoNews: { enabled: true } },
    })

    const tree = render(
      <Provider store={store}>
        <ExchangeHomeScreen />
      </Provider>
    )

    // Check we can see the Celo news header
    expect(tree.queryByText('celoNews.headerTitle')).toBeTruthy()

    // Check we cannot buy/sell/withdraw
    expect(tree.queryByTestId('BuyCelo')).toBeFalsy()
    expect(tree.queryByTestId('SellCelo')).toBeFalsy()
    expect(tree.queryByTestId('WithdrawCELO')).toBeFalsy()
  })
})
