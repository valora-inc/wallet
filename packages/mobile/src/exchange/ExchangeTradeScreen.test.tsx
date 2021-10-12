// @ts-ignore
import { toBeDisabled } from '@testing-library/jest-native'
import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ExchangeTradeScreen } from 'src/exchange/ExchangeTradeScreen'
import { ExchangeRates } from 'src/exchange/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockI18nProps, getMockStackScreenProps } from 'test/utils'
import { makeExchangeRates } from 'test/values'

jest.mock('src/components/useShowOrHideAnimation')

expect.extend({ toBeDisabled })

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '9.09090909')

const store = createMockStore({
  exchange: {
    exchangeRates,
  },
})

const balances = {
  [Currency.Dollar]: new BigNumber(20.02),
  [Currency.Celo]: new BigNumber(20),
  [Currency.Euro]: new BigNumber(10),
}

const localCurrencyExchangeRates = {
  [Currency.Dollar]: '20',
  [Currency.Euro]: null,
  [Currency.Celo]: null,
}

const mockScreenProps = getMockStackScreenProps(Screens.ExchangeTradeScreen, {
  buyCelo: false,
})

describe(ExchangeTradeScreen, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          {...mockScreenProps}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          updateLastUsedCurrency={jest.fn()}
          balances={balances}
          exchangeRates={exchangeRates}
          localCurrencyCode={LocalCurrencyCode.MXN}
          localCurrencyExchangeRates={localCurrencyExchangeRates}
          defaultCurrency={Currency.Dollar}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('validates the amount when selling gold', () => {
    const mockShowError = jest.fn()
    const mockhideAlert = jest.fn()

    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          {...mockScreenProps}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={mockShowError}
          hideAlert={mockhideAlert}
          updateLastUsedCurrency={jest.fn()}
          balances={balances}
          exchangeRates={exchangeRates}
          localCurrencyCode={LocalCurrencyCode.MXN}
          localCurrencyExchangeRates={localCurrencyExchangeRates}
          defaultCurrency={Currency.Dollar}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '50')
    expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_GOLD, null, {
      token: 'global:celoDollars',
    }) // Can't afford 50 gold
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    jest.clearAllMocks()
    fireEvent.press(getByTestId('ExchangeSwitchInput')) // Input is now in MXN
    expect(mockhideAlert).toBeCalled() // Can afford 50 MXN (2.50 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton')).not.toBeDisabled()

    jest.clearAllMocks()
    fireEvent.changeText(getByTestId('ExchangeInput'), '10000')
    expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_GOLD, null, {
      token: 'global:celoDollars',
    }) // Can't afford 10000 MXN (500 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()
  })

  it('validates the amount when selling dollars', () => {
    const mockShowError = jest.fn()
    const mockhideAlert = jest.fn()

    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          {...getMockStackScreenProps(Screens.ExchangeTradeScreen, {
            buyCelo: true,
          })}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={mockShowError}
          hideAlert={mockhideAlert}
          updateLastUsedCurrency={jest.fn()}
          balances={balances}
          exchangeRates={exchangeRates}
          localCurrencyCode={LocalCurrencyCode.MXN}
          localCurrencyExchangeRates={localCurrencyExchangeRates}
          defaultCurrency={Currency.Dollar}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '10')
    expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_STABLE, null, {
      token: 'global:celoDollars',
    }) // Can't afford 10 gold
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    jest.clearAllMocks()
    fireEvent.press(getByTestId('ExchangeSwitchInput')) // Input is now in MXN
    expect(mockhideAlert).toBeCalled() // Can afford 10 MXN (0.5 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton')).not.toBeDisabled()

    jest.clearAllMocks()
    fireEvent.changeText(getByTestId('ExchangeInput'), '401')
    expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_STABLE, null, {
      token: 'global:celoDollars',
    }) // Can't afford 400 MXN (20.05 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()
  })

  it('checks the minimum amount when selling gold', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          {...mockScreenProps}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          updateLastUsedCurrency={jest.fn()}
          balances={balances}
          exchangeRates={exchangeRates}
          localCurrencyCode={LocalCurrencyCode.USD}
          localCurrencyExchangeRates={{
            ...localCurrencyExchangeRates,
            [Currency.Dollar]: '1',
          }}
          defaultCurrency={Currency.Dollar}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '500')
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    fireEvent.changeText(getByTestId('ExchangeInput'), '0.0001')
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    // This is the minimum amount when exchanging gold (see GOLD_TRANSACTION_MIN_AMOUNT)
    // 0.001 is the actual minimum but when exchanging 0.001 at 0.11 rate it gives ~0.009 cUSD
    // which is 0 when rounded to the 2 decimals we support for cUSD
    fireEvent.changeText(getByTestId('ExchangeInput'), '0.002')
    expect(getByTestId('ExchangeReviewButton')).not.toBeDisabled()
  })

  it('checks the minimum amount when selling dollars', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          {...getMockStackScreenProps(Screens.ExchangeTradeScreen, {
            buyCelo: true,
          })}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          updateLastUsedCurrency={jest.fn()}
          balances={{
            ...balances,
            [Currency.Dollar]: new BigNumber('200'),
          }}
          exchangeRates={exchangeRates}
          localCurrencyCode={LocalCurrencyCode.USD}
          localCurrencyExchangeRates={{
            ...localCurrencyExchangeRates,
            [Currency.Dollar]: '1',
          }}
          defaultCurrency={Currency.Dollar}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '500')
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    fireEvent.changeText(getByTestId('ExchangeInput'), '0.001')
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    // This is the minimum amount when exchanging dollars (see STABLE_TRANSACTION_MIN_AMOUNT)
    fireEvent.changeText(getByTestId('ExchangeInput'), '0.01')
    expect(getByTestId('ExchangeReviewButton')).not.toBeDisabled()
  })
})
