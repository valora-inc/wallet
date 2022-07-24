import { FiatAccountType, FiatType } from '@fiatconnect/fiatconnect-types'
// @ts-ignore
import { toBeDisabled } from '@testing-library/jest-native'
import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD, DOLLAR_ADD_FUNDS_MAX_AMOUNT } from 'src/config'
import { attemptReturnUserFlow } from 'src/fiatconnect/slice'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  convertCurrencyToLocalAmount,
  convertLocalAmountToCurrency,
} from 'src/localCurrency/convert'
import { convertBetweenCurrencies } from 'src/localCurrency/hooks'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import { mockMaxSendAmount } from 'test/values'
import { CICOFlow } from './utils'

jest.mock('src/fees/hooks', () => ({
  useMaxSendAmount: () => mockMaxSendAmount,
}))

expect.extend({ toBeDisabled })

const usdExchangeRates = {
  [Currency.Dollar]: '1',
  [Currency.Euro]: '1.2',
  [Currency.Celo]: '3',
}

const eurExchangeRates = {
  [Currency.Dollar]: '0.862',
  [Currency.Euro]: '1',
  [Currency.Celo]: '2.5',
}

const phpExchangeRates = {
  [Currency.Dollar]: '50',
  [Currency.Euro]: '60',
  [Currency.Celo]: '150',
}

const storeWithUSD = createMockStore({
  stableToken: {
    balances: { [Currency.Dollar]: '1000.00', [Currency.Euro]: '500.00' },
  },
  goldToken: {
    balance: '5.5',
  },
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.USD,
    preferredCurrencyCode: LocalCurrencyCode.USD,
    exchangeRates: usdExchangeRates,
  },
})

const storeWithEUR = createMockStore({
  stableToken: {
    balances: { [Currency.Dollar]: '1000.00', [Currency.Euro]: '500.00' },
  },
  goldToken: {
    balance: '5.5',
  },
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.EUR,
    preferredCurrencyCode: LocalCurrencyCode.EUR,
    exchangeRates: eurExchangeRates,
  },
})

const storeWithPHP = createMockStore({
  stableToken: {
    balances: { [Currency.Dollar]: '1000.00', [Currency.Euro]: '500.00' },
  },
  goldToken: {
    balance: '5.5',
  },
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.PHP,
    preferredCurrencyCode: LocalCurrencyCode.PHP,
    exchangeRates: phpExchangeRates,
  },
})

describe('FiatExchangeAmount cashIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
  })

  it('renders correctly with USD as app currency', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with EUR as app currency', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithEUR}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('disables the next button if the cUSD amount is 0', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0')
    expect(tree.getByTestId('FiatExchangeNextButton')).toBeDisabled()
  })

  it('disables the next button if the cEUR amount is 0', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Euro,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0')
    expect(tree.getByTestId('FiatExchangeNextButton')).toBeDisabled()
  })

  it('enables the next button if the cUSD amount is greater than 0', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '5')
    expect(tree.getByTestId('FiatExchangeNextButton')).not.toBeDisabled()
  })

  it('enables the next button if the cEUR amount is greater than 0', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Euro,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithPHP}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '5')
    expect(tree.getByTestId('FiatExchangeNextButton')).not.toBeDisabled()
  })

  it('opens a dialog when the cUSD amount is higher than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      flow: CICOFlow.CashIn,
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

  it('opens a dialog when the cEUR amount is higher than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Euro,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithPHP}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    const maxAmountInLocalCurrency =
      convertCurrencyToLocalAmount(
        new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT),
        phpExchangeRates[Currency.Dollar]
      ) || new BigNumber(0)

    fireEvent.changeText(
      tree.getByTestId('FiatExchangeInput'),
      maxAmountInLocalCurrency.plus(1).toString()
    )
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the CELO amount is higher than the limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Celo,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    const maxAmountInCelo =
      convertBetweenCurrencies(
        new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT),
        Currency.Dollar,
        Currency.Celo,
        usdExchangeRates
      ) || new BigNumber(0)

    const overLimitAmount = maxAmountInCelo.plus(1)

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), overLimitAmount.toString())
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('invalidAmountDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('invalidAmountDialog/PrimaryAction'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens a dialog when the cUSD amount is higher than the daily limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      flow: CICOFlow.CashIn,
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

    expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
      flow: CICOFlow.CashIn,
      selectedCrypto: Currency.Dollar,
      amount: {
        fiat: overLimitAmount,
        crypto: overLimitAmount,
      },
    })
  })

  it('opens a dialog when the cEUR amount is higher than the daily limit', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Euro,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithPHP}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    const dailyLimitInLocalCurrency =
      convertCurrencyToLocalAmount(
        new BigNumber(DEFAULT_DAILY_PAYMENT_LIMIT_CUSD),
        phpExchangeRates[Currency.Dollar]
      ) || new BigNumber(0)

    const overLimitAmount = dailyLimitInLocalCurrency.plus(1)
    const overLimitAmountInCurrency =
      convertLocalAmountToCurrency(overLimitAmount, phpExchangeRates[Currency.Euro]) ||
      new BigNumber(0)

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), overLimitAmount.toString())
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(tree.getByTestId('DailyLimitDialog/PrimaryAction')).toBeTruthy()
    fireEvent.press(tree.getByTestId('DailyLimitDialog/PrimaryAction'))

    expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
      flow: CICOFlow.CashIn,
      selectedCrypto: Currency.Euro,
      amount: {
        fiat: overLimitAmount.toNumber(),
        crypto: overLimitAmountInCurrency.toNumber(),
      },
    })
  })

  it('redirects to contact screen when that option is pressed with a prefilled message', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      flow: CICOFlow.CashIn,
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
    flow: CICOFlow.CashOut,
  })

  const mockScreenPropsEuro = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    currency: Currency.Euro,
    flow: CICOFlow.CashOut,
  })

  const mockScreenPropsCelo = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    currency: Currency.Celo,
    flow: CICOFlow.CashOut,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
  })

  it('displays correctly for cUSD when local currency is USD', () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(getByText('amount (cUSD)')).toBeTruthy()
    expect(getElementText(getByTestId('LineItemRowTitle/subtotal'))).toBe('celoDollar @ $1.00')
    expect(getElementText(getByTestId('LineItemRow/subtotal'))).toBe('$0.00')
  })

  it('displays correctly for cEUR when local currency is USD', () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenPropsEuro} />
      </Provider>
    )
    expect(getByText('amount (cEUR)')).toBeTruthy()
    expect(getElementText(getByTestId('LineItemRowTitle/subtotal'))).toBe('celoEuro @ $1.20')
    expect(getElementText(getByTestId('LineItemRow/subtotal'))).toBe('$0.00')
  })

  it('displays correctly for CELO when local currency is USD', () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenPropsCelo} />
      </Provider>
    )
    expect(getByText('amount (CELO)')).toBeTruthy()
    expect(getElementText(getByTestId('LineItemRowTitle/subtotal'))).toBe('subtotal @ $3.00')
    expect(getElementText(getByTestId('LineItemRow/subtotal'))).toBe('$0.00')
  })

  it('disables the next button if the cUSD amount is 0', () => {
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0')
    expect(tree.getByTestId('FiatExchangeNextButton')).toBeDisabled()
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
      expect.arrayContaining([
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, undefined, {
          balance: '1000.00',
          currency: 'cUSD',
        }),
      ])
    )
  })

  it('shows an error banner if the user balance minus estimated transaction fee is less than the requested cash-out amount', () => {
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '999.99999')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(storeWithUSD.getActions()).toEqual(
      expect.arrayContaining([
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, undefined, {
          balance: '1000.00',
          currency: 'cUSD',
        }),
      ])
    )
  })

  it('navigates to the SelectProvider if the user balance is greater than the requested cash-out amount', () => {
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '750')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
      flow: CICOFlow.CashOut,
      selectedCrypto: Currency.Dollar,
      amount: {
        fiat: 750,
        crypto: 750,
      },
    })
  })
  it('calls diapatch attemptReturnUserFlow when there is a previously linked fiatconnect account', () => {
    const store = createMockStore({
      stableToken: {
        balances: { [Currency.Dollar]: '1000.00', [Currency.Euro]: '500.00' },
      },
      goldToken: {
        balance: '5.5',
      },
      localCurrency: {
        fetchedCurrencyCode: LocalCurrencyCode.USD,
        preferredCurrencyCode: LocalCurrencyCode.USD,
        exchangeRates: usdExchangeRates,
      },
      fiatConnect: {
        recentlyUsedFiatAccounts: [
          {
            providerId: 'provider-two',
            fiatAccountId: '123',
            fiatAccountType: FiatAccountType.BankAccount,
            flow: CICOFlow.CashOut,
            cryptoType: Currency.Dollar,
            fiatType: FiatType.USD,
          },
        ],
      },
    })
    store.dispatch = jest.fn()
    const screenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: Currency.Dollar,
      flow: CICOFlow.CashOut,
    })
    const tree = render(
      <Provider store={store}>
        <FiatExchangeAmount {...screenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '750')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(store.dispatch).toHaveBeenLastCalledWith(
      attemptReturnUserFlow({
        flow: CICOFlow.CashOut,
        selectedCrypto: Currency.Dollar,
        amount: {
          crypto: 750,
          fiat: 750,
        },
        providerId: 'provider-two',
        fiatAccountId: '123',
        fiatAccountType: FiatAccountType.BankAccount,
      })
    )
  })
})
