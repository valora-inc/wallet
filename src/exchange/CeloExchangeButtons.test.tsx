import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import CeloExchangeButtons from 'src/exchange/CeloExchangeButtons'
import { ExchangeRates } from 'src/exchange/reducer'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { makeExchangeRates } from 'test/values'

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

const mockScreenProps = getMockStackScreenProps(Screens.ExchangeHomeScreen)

describe('CeloExchangeButtons', () => {
  it('renders correctly', () => {
    const store = createMockStore({
      goldToken: { balance: '10' },
      stableToken: { balances: { [Currency.Dollar]: '10' } },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("hides buy button when there's no dollar balance", () => {
    const store = createMockStore({
      goldToken: { balance: '10' },
      stableToken: { balances: { [Currency.Dollar]: '0' } },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("hides sell button when there's no CELO balance", () => {
    const store = createMockStore({
      goldToken: { balance: '0' },
      stableToken: { balances: { [Currency.Dollar]: '10' } },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("returns null when there's no CELO and dollar balance", () => {
    const store = createMockStore({
      goldToken: { balance: '0' },
      stableToken: { balances: { [Currency.Dollar]: '0' } },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
