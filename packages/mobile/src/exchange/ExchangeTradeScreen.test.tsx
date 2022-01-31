// @ts-ignore
import { toBeDisabled } from '@testing-library/jest-native'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import { ExchangeRates } from 'src/exchange/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { makeExchangeRates } from 'test/values'

jest.mock('src/components/useShowOrHideAnimation')

expect.extend({ toBeDisabled })

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '9.09090909')

const createStore = ({
  dollarBalance = '20.02',
  localCurrencyCode,
  lastUsedCurrency = Currency.Dollar,
  localCurrencyDollarExchangeRate = '20',
}: {
  dollarBalance?: string
  localCurrencyCode: LocalCurrencyCode
  lastUsedCurrency?: Currency
  localCurrencyDollarExchangeRate?: string
}) =>
  createMockStore({
    exchange: {
      exchangeRates,
    },
    localCurrency: {
      exchangeRates: {
        [Currency.Dollar]: localCurrencyDollarExchangeRate,
        [Currency.Euro]: null,
        [Currency.Celo]: null,
      },
      preferredCurrencyCode: localCurrencyCode,
      fetchedCurrencyCode: localCurrencyCode,
    },
    stableToken: {
      balances: {
        [Currency.Dollar]: dollarBalance,
        [Currency.Euro]: '10',
      },
    },
    goldToken: {
      balance: '20',
    },
    send: {
      lastUsedCurrency,
    },
  })

const mockScreenProps = getMockStackScreenProps(Screens.ExchangeTradeScreen, {
  buyCelo: false,
})

describe(ExchangeTradeScreen, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createStore({ localCurrencyCode: LocalCurrencyCode.PHP })}>
        <ExchangeTradeScreen {...mockScreenProps} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('validates the amount when selling gold', () => {
    const store = createStore({ localCurrencyCode: LocalCurrencyCode.PHP })
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen {...mockScreenProps} />
      </Provider>
    )

    store.clearActions()
    fireEvent.changeText(getByTestId('ExchangeInput'), '50')

    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": null,
          "alertType": "error",
          "buttonMessage": null,
          "dismissAfter": null,
          "displayMethod": 0,
          "message": "notEnoughGoldError, {\\"token\\":\\"celoDollars\\"}",
          "title": null,
          "type": "ALERT/SHOW",
          "underlyingError": "notEnoughGoldError",
        },
      ]
    `)
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    store.clearActions()

    fireEvent.press(getByTestId('ExchangeSwitchInput')) // Input is now in PHP
    expect(store.getActions()).toEqual([{ type: 'ALERT/HIDE' }]) // Can afford 50 PHP (2.50 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton')).not.toBeDisabled()

    store.clearActions()

    fireEvent.changeText(getByTestId('ExchangeInput'), '10000')
    // Can't afford 10000 PHP (500 cUSD) worth of gold
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": null,
          "alertType": "error",
          "buttonMessage": null,
          "dismissAfter": null,
          "displayMethod": 0,
          "message": "notEnoughGoldError, {\\"token\\":\\"celoDollars\\"}",
          "title": null,
          "type": "ALERT/SHOW",
          "underlyingError": "notEnoughGoldError",
        },
      ]
    `)

    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()
  })

  it('validates the amount when selling dollars', () => {
    const store = createStore({ localCurrencyCode: LocalCurrencyCode.PHP })
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          {...getMockStackScreenProps(Screens.ExchangeTradeScreen, {
            buyCelo: true,
          })}
        />
      </Provider>
    )

    store.clearActions()

    fireEvent.changeText(getByTestId('ExchangeInput'), '10')
    // Can't afford 10 CELO
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": null,
          "alertType": "error",
          "buttonMessage": null,
          "dismissAfter": null,
          "displayMethod": 0,
          "message": "notEnoughStableError, {\\"token\\":\\"celoDollars\\"}",
          "title": null,
          "type": "ALERT/SHOW",
          "underlyingError": "notEnoughStableError",
        },
      ]
    `)
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    store.clearActions()

    fireEvent.press(getByTestId('ExchangeSwitchInput')) // Input is now in PHP
    expect(store.getActions()).toEqual([{ type: 'ALERT/HIDE' }]) // Can afford 10 PHP (0.5 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton')).not.toBeDisabled()

    store.clearActions()

    fireEvent.changeText(getByTestId('ExchangeInput'), '401')
    // Can't afford 400 PHP (20.05 cUSD) worth of CELO
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": null,
          "alertType": "error",
          "buttonMessage": null,
          "dismissAfter": null,
          "displayMethod": 0,
          "message": "notEnoughStableError, {\\"token\\":\\"celoDollars\\"}",
          "title": null,
          "type": "ALERT/SHOW",
          "underlyingError": "notEnoughStableError",
        },
      ]
    `)
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()
  })

  it('checks the minimum amount when selling gold', () => {
    const { getByTestId } = render(
      <Provider
        store={createStore({
          localCurrencyCode: LocalCurrencyCode.USD,
          localCurrencyDollarExchangeRate: '1',
        })}
      >
        <ExchangeTradeScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '500')
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    fireEvent.changeText(getByTestId('ExchangeInput'), '0.0001')
    expect(getByTestId('ExchangeReviewButton')).toBeDisabled()

    // This is the minimum amount when exchanging gold (see CELO_TRANSACTION_MIN_AMOUNT)
    // 0.001 is the actual minimum but when exchanging 0.001 at 0.11 rate it gives ~0.009 cUSD
    // which is 0 when rounded to the 2 decimals we support for cUSD
    fireEvent.changeText(getByTestId('ExchangeInput'), '0.002')
    expect(getByTestId('ExchangeReviewButton')).not.toBeDisabled()
  })

  it('checks the minimum amount when selling dollars', () => {
    const { getByTestId } = render(
      <Provider
        store={createStore({
          dollarBalance: '200',
          localCurrencyCode: LocalCurrencyCode.USD,
          localCurrencyDollarExchangeRate: '1',
        })}
      >
        <ExchangeTradeScreen
          {...getMockStackScreenProps(Screens.ExchangeTradeScreen, {
            buyCelo: true,
          })}
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
