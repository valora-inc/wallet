import { NavigationContainer } from '@react-navigation/native'
import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ExchangeRatePair } from 'src/exchange/reducer'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import { createMockStore, getElementText } from 'test/utils'

const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.11', dollarMaker: '10' }

// This avoids rendering WalletHome as we're mostly interested in testing the menu here
jest.mock('src/home/WalletHome')

describe('DrawerNavigator', () => {
  it('renders correctly with both cUSD and CELO balances', () => {
    const store = createMockStore({
      stableToken: { balance: '10', cEurBalance: '15' },
      goldToken: { balance: '2' },
      exchange: { exchangeRatePair },
      localCurrency: {
        exchangeRate: '1.33',
        eurExchangeRate: '2',
        celoExchangeRate: '3',
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
      stableToken: { balance: '10', cEurBalance: '0.001' },
      goldToken: { balance: '0.001' },
      exchange: { exchangeRatePair },
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
