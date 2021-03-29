import * as React from 'react'
import { fireEvent, render, RenderAPI } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ExchangeRatePair } from 'src/exchange/reducer'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.5', dollarMaker: '1' }

const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
  currency: CURRENCY_ENUM.DOLLAR,
  paymentMethod: PaymentMethod.BANK,
})

const store = createMockStore({
  stableToken: {
    balance: '1000.00',
  },
  exchange: { exchangeRatePair },
})

describe('FiatExchangeAmount', () => {
  let tree: RenderAPI

  beforeEach(() => {
    tree = render(
      <Provider store={store}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
  })

  it('renders correctly', () => {
    const { toJSON } = tree
    expect(toJSON()).toMatchSnapshot()
  })

  it('disables the next button if the amount is 0', () => {
    const { getByTestId } = tree

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '0')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(true)
  })

  it('disables the next button if the amount is 0', () => {
    const { getByTestId } = tree

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '0')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(true)
  })

  it('enables the next button if the amount is greater than 0', () => {
    const { getByTestId } = tree

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '5')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(false)
  })

  it('opens a dialog when the amount is lower than the limit', () => {
    const { getByTestId } = tree

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '5')
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    expect(getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the amount is lower than the limit', () => {
    const { getByTestId } = tree

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '20001')
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    expect(getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the amount is higher than the daily limit', () => {
    const { getByTestId } = tree

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '600')
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    expect(getByTestId('DailyLimitDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(getByTestId('DailyLimitDialog/PrimaryAction'))

    expect(navigate).toHaveBeenCalledWith(Screens.ProviderOptionsScreen, {
      isCashIn: true,
      selectedCrypto: CURRENCY_ENUM.DOLLAR,
      amount: {
        fiat: 600,
        crypto: 600,
      },
      paymentMethod: PaymentMethod.BANK,
    })
  })

  it('redirects to contact screen when that option is pressed with a prefilled message', () => {
    const { getByTestId } = tree

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '600')
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    fireEvent.press(getByTestId('DailyLimitDialog/SecondaryAction'))

    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact, {
      prefilledText: 'dailyLimitRequest',
    })
  })
})
