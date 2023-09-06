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
import { getFeatureGate } from 'src/statsig'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import { mockCeloAddress, mockCeurAddress, mockCusdAddress, mockMaxSendAmount } from 'test/values'
import { CICOFlow } from './utils'
import { Network } from 'src/transactions/types'
import { StatsigFeatureGates } from 'src/statsig/types'

const mockUseMaxSendAmount = jest.fn(() => mockMaxSendAmount)
jest.mock('src/fees/hooks', () => ({
  useMaxSendAmount: () => mockUseMaxSendAmount(),
}))
jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
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

const mockTokens = {
  tokenBalances: {
    [mockCusdAddress]: {
      address: mockCusdAddress,
      symbol: 'cUSD',
      balance: '200',
      usdPrice: '1',
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
    [mockCeurAddress]: {
      address: mockCeurAddress,
      symbol: 'cEUR',
      balance: '100',
      usdPrice: '1.2',
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
    [mockCeloAddress]: {
      address: mockCeloAddress,
      symbol: 'CELO',
      balance: '200',
      usdPrice: '5',
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
  },
}

const storeWithUSD = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.USD,
    preferredCurrencyCode: LocalCurrencyCode.USD,
    exchangeRates: usdExchangeRates,
  },
  tokens: mockTokens,
})

const storeWithEUR = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.EUR,
    preferredCurrencyCode: LocalCurrencyCode.EUR,
    exchangeRates: eurExchangeRates,
  },
  tokens: mockTokens,
})

const storeWithPHP = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.PHP,
    preferredCurrencyCode: LocalCurrencyCode.PHP,
    exchangeRates: phpExchangeRates,
  },
  tokens: mockTokens,
})

describe('FiatExchangeAmount cashIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
    jest.mocked(getFeatureGate).mockImplementation((gate) => {
      return gate === StatsigFeatureGates.SHOW_NATIVE_TOKENS
    })
  })

  it.each([
    { currency: CiCoCurrency.cUSD, network: Network.Celo },
    { currency: CiCoCurrency.cEUR, network: Network.Celo },
    { currency: CiCoCurrency.ETH, network: Network.Ethereum },
  ])(`disables the next button if the $currency amount is 0`, ({ currency, network }) => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency,
      flow: CICOFlow.CashIn,
      network,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0')
    expect(tree.getByTestId('FiatExchangeNextButton')).toBeDisabled()
  })

  it.each([
    { currency: CiCoCurrency.cUSD, network: Network.Celo, store: storeWithUSD },
    { currency: CiCoCurrency.cEUR, network: Network.Celo, store: storeWithPHP },
    { currency: CiCoCurrency.ETH, network: Network.Ethereum, store: storeWithUSD },
  ])(
    `enables the next button if the $currency amount is greater than 0`,
    ({ currency, network, store }) => {
      const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
        currency,
        flow: CICOFlow.CashIn,
        network,
      })
      const tree = render(
        <Provider store={store}>
          <FiatExchangeAmount {...mockScreenProps} />
        </Provider>
      )

      fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '5')
      expect(tree.getByTestId('FiatExchangeNextButton')).not.toBeDisabled()
    }
  )

  it('renders correctly with USD as app currency', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: CiCoCurrency.cUSD,
      flow: CICOFlow.CashIn,
      network: Network.Celo,
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
      currency: CiCoCurrency.cUSD,
      flow: CICOFlow.CashIn,
      network: Network.Celo,
    })
    const tree = render(
      <Provider store={storeWithEUR}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

describe('FiatExchangeAmount cashOut', () => {
  const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    currency: CiCoCurrency.cUSD,
    flow: CICOFlow.CashOut,
    network: Network.Celo,
  })

  const mockScreenPropsEuro = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    currency: CiCoCurrency.cEUR,
    flow: CICOFlow.CashOut,
    network: Network.Celo,
  })

  const mockScreenPropsCelo = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    currency: CiCoCurrency.CELO,
    flow: CICOFlow.CashOut,
    network: Network.Celo,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
    jest.mocked(getFeatureGate).mockReturnValue(false)
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
    expect(getByText('disclaimerFiat, {"currency":"celoDollar"}')).toBeTruthy()
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
    expect(getByText('disclaimerFiat, {"currency":"celoEuro"}')).toBeTruthy()
  })

  it('displays correctly for CELO when local currency is USD', () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenPropsCelo} />
      </Provider>
    )
    expect(getByText('amount (CELO)')).toBeTruthy()
    expect(getElementText(getByTestId('LineItemRowTitle/subtotal'))).toBe('subtotal @ $5.00')
    expect(getElementText(getByTestId('LineItemRow/subtotal'))).toBe('$0.00')
  })

  it('displays correctly when the SHOW_RECEIVE_AMOUNT_IN_SELECT_PROVIDER feature flag is on', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const { getByText, queryByTestId, queryByText } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(getByText('amount (cUSD)')).toBeTruthy()
    expect(queryByTestId('LineItemRowTitle/subtotal')).toBeFalsy()
    expect(queryByTestId('LineItemRow/subtotal')).toBeFalsy()
    expect(queryByText('disclaimerFiat, {"currency":"celoDollar"}')).toBeFalsy()
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
      selectedCrypto: CiCoCurrency.cUSD,
      amount: {
        fiat: 750,
        crypto: 750,
      },
      network: Network.Celo,
    })
  })
  it('calls dispatch attemptReturnUserFlow when there is a previously linked fiatconnect account', () => {
    const store = createMockStore({
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
            cryptoType: CiCoCurrency.cUSD,
            fiatType: FiatType.USD,
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
          },
        ],
      },
    })
    store.dispatch = jest.fn()
    const screenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: CiCoCurrency.cUSD,
      flow: CICOFlow.CashOut,
      network: Network.Celo,
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
        selectedCrypto: CiCoCurrency.cUSD,
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
  it('calls dispatch attemptReturnUserFlow when there is a previously linked fiatconnect account that used a different flow', () => {
    const store = createMockStore({
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
            flow: CICOFlow.CashIn,
            cryptoType: CiCoCurrency.cUSD,
            fiatType: FiatType.USD,
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
          },
        ],
      },
    })
    store.dispatch = jest.fn()
    const screenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      currency: CiCoCurrency.cUSD,
      flow: CICOFlow.CashOut,
      network: Network.Celo,
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
        selectedCrypto: CiCoCurrency.cUSD,
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
