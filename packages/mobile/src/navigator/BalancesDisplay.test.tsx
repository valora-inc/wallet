import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { ExchangeRates } from 'src/exchange/reducer'
import BalancesDisplay from 'src/navigator/BalancesDisplay'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText } from 'test/utils'
import { makeExchangeRates } from 'test/values'

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')
describe('BalancesDisplay', () => {
  it('renders correctly with both cUSD and CELO balances', () => {
    const store = createMockStore({
      stableToken: { balances: { [Currency.Dollar]: '10', [Currency.Euro]: '15' } },
      goldToken: { balance: '2' },
      exchange: { exchangeRates },
      localCurrency: {
        exchangeRates: {
          [Currency.Dollar]: '1.33',
          [Currency.Euro]: '2',
          [Currency.Celo]: '3',
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <BalancesDisplay />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('LocalDollarBalance/value'))).toEqual('₱13.30')
    expect(getElementText(tree.getByTestId('DollarBalance/value'))).toEqual('10.00 celoDollars')

    expect(getElementText(tree.getByTestId('LocalEuroBalance/value'))).toEqual('₱30.00')
    expect(getElementText(tree.getByTestId('EuroBalance/value'))).toEqual('15.00 celoEuros')

    expect(getElementText(tree.getByTestId('LocalCeloBalance/value'))).toEqual('₱6.00')
    expect(getElementText(tree.getByTestId('CeloBalance/value'))).toEqual('2.000 celoGold')
  })

  it('renders only with the cUSD balance when the cEUR and CELO balances are (almost) 0', () => {
    const store = createMockStore({
      stableToken: { balances: { [Currency.Dollar]: '10', [Currency.Euro]: '0.001' } },
      goldToken: { balance: '0.001' },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <BalancesDisplay />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('LocalDollarBalance/value'))).toEqual('₱13.30')
    expect(getElementText(tree.getByTestId('DollarBalance/value'))).toEqual('10.00 celoDollars')

    expect(tree.queryByTestId('LocalEuroBalance/value')).toBeFalsy()
    expect(tree.queryByTestId('EuroBalance/value')).toBeFalsy()

    expect(tree.queryByTestId('LocalCeloBalance/value')).toBeFalsy()
    expect(tree.queryByTestId('CeloBalance/value')).toBeFalsy()
  })
})
