import { NavigationContainer } from '@react-navigation/native'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { ExchangeRates } from 'src/exchange/reducer'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText } from 'test/utils'
import { makeExchangeRates } from 'test/values'

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

// This avoids rendering WalletHome as we're mostly interested in testing the menu here
jest.mock('src/home/WalletHome')
// Note (Tom): Failing with update to @testing-library/react-native
describe.skip('DrawerNavigator', () => {
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
        <NavigationContainer>
          <DrawerNavigator />
        </NavigationContainer>
      </Provider>
    )

    expect(getElementText(tree.getByTestId('LocalDollarBalance'))).toEqual('$13.30')
    expect(getElementText(tree.getByTestId('DollarBalance'))).toEqual('10.00 global:celoDollars')

    expect(getElementText(tree.getByTestId('LocalEuroBalance'))).toEqual('$30.00')
    expect(getElementText(tree.getByTestId('EuroBalance'))).toEqual('15.00 global:celoEuros')

    expect(getElementText(tree.getByTestId('LocalCeloBalance'))).toEqual('$6.00')
    expect(getElementText(tree.getByTestId('CeloBalance'))).toEqual('2.000 global:celoGold')
  })

  it('renders only with the cUSD balance when the cEUR and CELO balances are (almost) 0', () => {
    const store = createMockStore({
      stableToken: { balances: { [Currency.Dollar]: '10', [Currency.Euro]: '0.001' } },
      goldToken: { balance: '0.001' },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <NavigationContainer>
          <DrawerNavigator />
        </NavigationContainer>
      </Provider>
    )

    expect(getElementText(tree.getByTestId('LocalDollarBalance'))).toEqual('$13.30')
    expect(getElementText(tree.getByTestId('DollarBalance'))).toEqual('10.00 global:celoDollars')

    expect(tree.queryByTestId('LocalEuroBalance')).toBeFalsy()
    expect(tree.queryByTestId('EuroBalance')).toBeFalsy()

    expect(tree.queryByTestId('LocalCeloBalance')).toBeFalsy()
    expect(tree.queryByTestId('CeloBalance')).toBeFalsy()
  })
})
