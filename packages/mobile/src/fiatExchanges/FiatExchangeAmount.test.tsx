import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ExchangeRatePair } from 'src/exchange/reducer'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.5', dollarMaker: '1' }

const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
  currency: CURRENCY_ENUM.DOLLAR,
})

describe('FiatExchangeAmount', () => {
  const store = createMockStore({
    stableToken: {
      balance: '1000.00',
    },
    exchange: { exchangeRatePair },
  })

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('validates the amount when cashing in', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '5')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(false)

    // When pressing the next button with an amount lower to the limit, we see a dialog.
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    expect(getByTestId('MinAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(getByTestId('MinAmountDialog/PrimaryAction'))

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '0')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(true)
    fireEvent.changeText(getByTestId('FiatExchangeInput'), '600')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(false)
    // When pressing the next button with an amount higher than the daily limit, we see a dialog.
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    expect(getByTestId('DailyLimitDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(getByTestId('MinAmountDialog/PrimaryAction'))

    expect(navigate).toHaveBeenCalledWith(Screens.ProviderOptionsScreen, {
      isCashIn: true,
      currency: CURRENCY_ENUM.DOLLAR,
      amount: 600,
    })
  })

  it('redirects to contact screen when that option is pressed with a prefilled message', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '600')
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    fireEvent.press(getByTestId('DailyLimitDialog/SecondaryAction'))

    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact, {
      prefilledText: 'dailyLimitRequest',
    })
  })
})
