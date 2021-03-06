import { CURRENCY_ENUM } from '@celo/utils'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ProviderOptionsScreen from 'src/fiatExchanges/ProviderOptionsScreen'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const AMOUNT_TO_CASH_IN = 100

const mockScreenProps = (isCashIn: boolean) =>
  getMockStackScreenProps(Screens.ProviderOptionsScreen, {
    isCashIn,
    currency: CURRENCY_ENUM.DOLLAR,
    amount: AMOUNT_TO_CASH_IN,
  })

const mockStore = createMockStore({
  account: {
    defaultCountryCode: '+54',
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.BRL,
  },
})

describe('ProviderOptionsScreen', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('opens Simplex correctly', () => {
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    fireEvent.press(getByTestId('Provider/SIMPLEX'))
    expect(navigateToURI).toHaveBeenCalled()
  })

  it('opens MoonPay correctly', () => {
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    fireEvent.press(getByTestId('Provider/MOONPAY'))
    expect(navigate).toHaveBeenCalledWith(Screens.MoonPayScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CURRENCY_ENUM.DOLLAR,
    })
  })

  it('opens Ramp correctly', () => {
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    fireEvent.press(getByTestId('Provider/RAMP'))
    expect(navigate).toHaveBeenCalledWith(Screens.RampScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CURRENCY_ENUM.DOLLAR,
    })
  })

  it('opens Transak correctly', () => {
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    fireEvent.press(getByTestId('Provider/TRANSAK'))
    expect(navigate).toHaveBeenCalledWith(Screens.TransakScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CURRENCY_ENUM.DOLLAR,
    })
  })
})
