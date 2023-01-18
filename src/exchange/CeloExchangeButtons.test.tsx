import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import CeloExchangeButtons from 'src/exchange/CeloExchangeButtons'
import { ExchangeRates } from 'src/exchange/reducer'
import { createMockStore } from 'test/utils'
import { makeExchangeRates, mockCeloAddress, mockCusdAddress, mockTokenBalances } from 'test/values'

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

describe('CeloExchangeButtons', () => {
  it('renders correctly', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            ...mockTokenBalances[mockCusdAddress],
            balance: '10',
          },
          [mockCeloAddress]: {
            ...mockTokenBalances[mockCeloAddress],
            balance: '10',
          },
        },
      },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("hides buy button when there's no dollar balance", () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            ...mockTokenBalances[mockCusdAddress],
            balance: '0',
          },
          [mockCeloAddress]: {
            ...mockTokenBalances[mockCeloAddress],
            balance: '10',
          },
        },
      },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("hides sell button when there's no CELO balance", () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            ...mockTokenBalances[mockCusdAddress],
            balance: '10',
          },
          [mockCeloAddress]: {
            ...mockTokenBalances[mockCeloAddress],
            balance: '0',
          },
        },
      },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("returns null when there's no CELO and dollar balance", () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            ...mockTokenBalances[mockCusdAddress],
            balance: '0',
          },
          [mockCeloAddress]: {
            ...mockTokenBalances[mockCeloAddress],
            balance: '0',
          },
        },
      },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
