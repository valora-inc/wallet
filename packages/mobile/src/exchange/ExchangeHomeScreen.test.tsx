import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import { ExchangeRates } from 'src/exchange/reducer'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { makeExchangeRates } from 'test/values'

// Mock this for now, as we get apollo issues
jest.mock('src/transactions/TransactionsList', () => 'TransactionsList')

const mockScreenProps = getMockStackScreenProps(Screens.ExchangeHomeScreen)
const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

describe('ExchangeHomeScreen', () => {
  it('renders and behaves correctly for non CP-DOTO restricted countries', () => {
    const store = createMockStore({
      goldToken: { balance: '2' },
      stableToken: { balances: { [Currency.Dollar]: '10' } },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <ExchangeHomeScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()

    jest.clearAllMocks()
    fireEvent.press(tree.getByTestId('BuyCelo'))
    expect(mockScreenProps.navigation.navigate).toHaveBeenCalledWith(Screens.ExchangeTradeScreen, {
      buyCelo: true,
    })

    jest.clearAllMocks()
    fireEvent.press(tree.getByTestId('SellCelo'))
    expect(mockScreenProps.navigation.navigate).toHaveBeenCalledWith(Screens.ExchangeTradeScreen, {
      buyCelo: false,
    })

    jest.clearAllMocks()
    fireEvent.press(tree.getByTestId('WithdrawCELO'))
    expect(mockScreenProps.navigation.navigate).toHaveBeenCalledWith(Screens.WithdrawCeloScreen, {
      isCashOut: false,
    })
  })

  it('renders and behaves correctly for CP-DOTO restricted countries', () => {
    const store = createMockStore({
      networkInfo: {
        userLocationData: {
          countryCodeAlpha2: 'PH', // PH is restricted for CP-DOTO
          region: null,
          ipAddress: null,
        },
      },
      goldToken: { balance: '2' },
      stableToken: { balances: { [Currency.Dollar]: '10' } },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <ExchangeHomeScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()

    // Check we cannot buy/sell
    expect(tree.queryByTestId('BuyCelo')).toBeFalsy()
    expect(tree.queryByTestId('SellCelo')).toBeFalsy()

    // Check we can withdraw
    fireEvent.press(tree.getByTestId('WithdrawCELO'))
    expect(mockScreenProps.navigation.navigate).toHaveBeenCalledWith(Screens.WithdrawCeloScreen, {
      isCashOut: false,
    })
  })
})
