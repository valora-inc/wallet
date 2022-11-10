import { FiatAccountSchema, FiatAccountType, FiatType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { attemptReturnUserFlow } from 'src/fiatconnect/slice'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import { mockMaxSendAmount } from 'test/values'
import { CICOFlow } from './utils'

jest.mock('src/fees/hooks', () => ({
  useMaxSendAmount: () => mockMaxSendAmount,
}))

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
        cachedFiatAccountUses: [
          {
            providerId: 'provider-two',
            fiatAccountId: '123',
            fiatAccountType: FiatAccountType.BankAccount,
            flow: CICOFlow.CashOut,
            cryptoType: Currency.Dollar,
            fiatType: FiatType.USD,
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
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
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
      })
    )
  })
})
