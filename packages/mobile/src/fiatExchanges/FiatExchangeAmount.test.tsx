import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
  DOLLAR_ADD_FUNDS_MAX_AMOUNT,
  DOLLAR_ADD_FUNDS_MIN_AMOUNT,
} from 'src/config'
import { ExchangeRates } from 'src/exchange/reducer'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { emptyExchangeRates } from 'test/values'

const exchangeRates: ExchangeRates = {
  ...emptyExchangeRates,
  [Currency.Celo]: {
    ...emptyExchangeRates[Currency.Celo],
    [Currency.Dollar]: '0.5',
  },
  [Currency.Dollar]: {
    ...emptyExchangeRates[Currency.Dollar],
    [Currency.Celo]: '1',
  },
}
const usdToPHPExchangeRate = 50

const storeWithUSD = createMockStore({
  stableToken: {
    balances: { [Currency.Dollar]: '1000.00' },
  },
  goldToken: {
    balance: '5.5',
  },
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.USD,
    preferredCurrencyCode: LocalCurrencyCode.USD,
    exchangeRates: { [Currency.Dollar]: '1' },
  },
  exchange: { exchangeRates },
})

const storeWithPHP = createMockStore({
  stableToken: {
    balances: { [Currency.Dollar]: '1000.00' },
  },
  goldToken: {
    balance: '5.5',
  },
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.PHP,
    preferredCurrencyCode: LocalCurrencyCode.PHP,
    exchangeRates: { [Currency.Dollar]: usdToPHPExchangeRate.toString() },
  },
  exchange: { exchangeRates },
})

describe('FiatExchangeAmount cashIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
  })

  it('renders correctly', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('disables the next button if the cUSD amount is 0', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0')
    expect(tree.getByTestId('FiatExchangeNextButton').props.disabled).toBe(true)
  })

  it('enables the next button if the cUSD amount is greater than 0', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '5')
    expect(tree.getByTestId('FiatExchangeNextButton').props.disabled).toBe(false)
  })

  it('opens a dialog when the cUSD amount is lower than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(
      tree.getByTestId('FiatExchangeInput'),
      (DOLLAR_ADD_FUNDS_MIN_AMOUNT - 1).toString()
    )
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the cUSD amount (in non-USD currency) is lower than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithPHP}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(
      tree.getByTestId('FiatExchangeInput'),
      (DOLLAR_ADD_FUNDS_MIN_AMOUNT * usdToPHPExchangeRate - 1).toString()
    )
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the CELO amount is lower than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Celo,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0.5')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the cUSD amount is higher than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(
      tree.getByTestId('FiatExchangeInput'),
      (DOLLAR_ADD_FUNDS_MAX_AMOUNT + 1).toString()
    )
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the cUSD amount (in non-USD currency) is higher than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithPHP}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(
      tree.getByTestId('FiatExchangeInput'),
      (DOLLAR_ADD_FUNDS_MAX_AMOUNT * usdToPHPExchangeRate + 1).toString()
    )
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the CELO amount is higher than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Celo,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    const overLimitAmount =
      (DOLLAR_ADD_FUNDS_MAX_AMOUNT + 1) / Number(exchangeRates[Currency.Celo][Currency.Dollar])

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), overLimitAmount.toString())
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the cUSD amount is higher than the daily limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    const overLimitAmount = DEFAULT_DAILY_PAYMENT_LIMIT_CUSD + 1

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), overLimitAmount.toString())
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('DailyLimitDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('DailyLimitDialog/PrimaryAction'))

    expect(navigate).toHaveBeenCalledWith(Screens.ProviderOptionsScreen, {
      isCashIn: true,
      selectedCrypto: Currency.Dollar,
      amount: {
        fiat: overLimitAmount,
        crypto: overLimitAmount,
      },
      paymentMethod: PaymentMethod.Bank,
    })
  })

  it('opens a dialog when the cUSD amount (in non-USD currency) is higher than the daily limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithPHP}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    const overLimitAmount = DEFAULT_DAILY_PAYMENT_LIMIT_CUSD * usdToPHPExchangeRate + 1

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), overLimitAmount.toString())
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('DailyLimitDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('DailyLimitDialog/PrimaryAction'))

    expect(navigate).toHaveBeenCalledWith(Screens.ProviderOptionsScreen, {
      isCashIn: true,
      selectedCrypto: Currency.Dollar,
      amount: {
        fiat: overLimitAmount,
        crypto: overLimitAmount / usdToPHPExchangeRate,
      },
      paymentMethod: PaymentMethod.Bank,
    })
  })

  it('redirects to contact screen when that option is pressed with a prefilled message', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      paymentMethod: PaymentMethod.Bank,
      isCashIn: true,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '600')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    fireEvent.press(tree.getByTestId('DailyLimitDialog/SecondaryAction'))

    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact, {
      prefilledText: 'dailyLimitRequest',
    })
  })
})

describe('FiatExchangeAmount cashOut', () => {
  const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    currency: Currency.Dollar,
    paymentMethod: PaymentMethod.Bank,
    isCashIn: false,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
  })

  it('disables the next button if the cUSD amount is 0', () => {
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0')
    expect(tree.getByTestId('FiatExchangeNextButton').props.disabled).toBe(true)
  })

  it('shows an error banner if the user balance is less than the requested cash-out amount', () => {
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '1001')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(storeWithUSD.getActions()).toEqual(
      expect.arrayContaining([showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED)])
    )
  })

  it('shows an error banner if the user balance (in non- USD currency) is less than the requested cash-out amount', () => {
    const tree = render(
      <Provider store={storeWithPHP}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '75000')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(storeWithPHP.getActions()).toEqual(
      expect.arrayContaining([showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED)])
    )
  })

  it('navigates to the ProviderOptionsScreen if the user balance is greater than the requested cash-out amount', () => {
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '750')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ProviderOptionsScreen, {
      isCashIn: false,
      selectedCrypto: Currency.Dollar,
      amount: {
        fiat: 750,
        crypto: 750,
      },
      paymentMethod: PaymentMethod.Bank,
    })
  })

  it('navigates to the ProviderOptionsScreen if the user balance (in non- USD currency) is greater than the requested cash-out amount', () => {
    const tree = render(
      <Provider store={storeWithPHP}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '25000')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ProviderOptionsScreen, {
      isCashIn: false,
      selectedCrypto: Currency.Dollar,
      amount: {
        fiat: 25000,
        crypto: 500,
      },
      paymentMethod: PaymentMethod.Bank,
    })
  })
})
