import { FiatAccountSchema, FiatAccountType, FiatType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import { attemptReturnUserFlow } from 'src/fiatconnect/slice'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { CiCoCurrency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockEthTokenId,
  mockMaxSendAmount,
} from 'test/values'
import { CICOFlow } from './utils'

const mockUseMaxSendAmount = jest.fn(() => mockMaxSendAmount)

jest.mock('src/fees/hooks', () => ({
  useMaxSendAmount: () => mockUseMaxSendAmount(),
}))
jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
}))
jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereum-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const usdToUsdRate = '1'
const usdToEurRate = '0.862'
const usdToPhpRate = '50'

const mockTokens = {
  tokenBalances: {
    [mockCusdTokenId]: {
      address: mockCusdAddress,
      tokenId: mockCusdTokenId,
      networkId: NetworkId['celo-alfajores'],
      symbol: 'cUSD',
      balance: '200',
      priceUsd: '1',
      isFeeCurrency: true,
      priceFetchedAt: Date.now(),
    },
    [mockCeurTokenId]: {
      address: mockCeurAddress,
      tokenId: mockCeurTokenId,
      networkId: NetworkId['celo-alfajores'],
      symbol: 'cEUR',
      balance: '100',
      priceUsd: '1.2',
      isFeeCurrency: true,
      priceFetchedAt: Date.now(),
    },
    [mockCeloTokenId]: {
      address: mockCeloAddress,
      tokenId: mockCeloTokenId,
      networkId: NetworkId['celo-alfajores'],
      symbol: 'CELO',
      balance: '200',
      priceUsd: '5',
      isFeeCurrency: true,
      priceFetchedAt: Date.now(),
    },
    [mockEthTokenId]: {
      address: undefined,
      tokenId: mockEthTokenId,
      networkId: NetworkId['ethereum-sepolia'],
      symbol: 'ETH',
      balance: '1',
      priceUsd: '1000',
      isFeeCurrency: true,
      priceFetchedAt: Date.now(),
    },
  },
}

const storeWithUSD = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.USD,
    preferredCurrencyCode: LocalCurrencyCode.USD,
    usdToLocalRate: usdToUsdRate,
  },
  tokens: mockTokens,
})

const storeWithEUR = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.EUR,
    preferredCurrencyCode: LocalCurrencyCode.EUR,
    usdToLocalRate: usdToEurRate,
  },
  tokens: mockTokens,
})

const storeWithPHP = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.PHP,
    preferredCurrencyCode: LocalCurrencyCode.PHP,
    usdToLocalRate: usdToPhpRate,
  },
  tokens: mockTokens,
})

describe('FiatExchangeAmount cashIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
  })

  it.each([
    { currency: 'cUSD', tokenId: mockCusdTokenId },
    { currency: 'cEUR', tokenId: mockCeurTokenId },
    { currency: 'ETH', tokenId: mockEthTokenId },
  ])(`disables the next button if the $currency amount is 0`, ({ tokenId, currency }) => {
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      tokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: currency,
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
    {
      currency: 'cUSD',
      tokenId: mockCusdTokenId,
      store: storeWithUSD,
    },
    {
      currency: 'cEUR',
      tokenId: mockCeurTokenId,
      store: storeWithPHP,
    },
    {
      currency: 'ETH',
      tokenId: mockEthTokenId,
      store: storeWithUSD,
    },
  ])(
    `enables the next button if the $currency amount is greater than 0`,
    ({ tokenId, currency, store }) => {
      const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
        tokenId,
        flow: CICOFlow.CashIn,
        tokenSymbol: currency,
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
      tokenId: mockCusdTokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: 'cUSD',
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
      tokenId: mockCusdTokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: 'cUSD',
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
    tokenId: mockCusdTokenId,
    flow: CICOFlow.CashOut,
    tokenSymbol: 'cUSD',
  })

  const mockScreenPropsEuro = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    tokenId: mockCeurTokenId,
    flow: CICOFlow.CashOut,
    tokenSymbol: 'cEUR',
  })

  const mockScreenPropsCelo = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    tokenId: mockCeloTokenId,
    flow: CICOFlow.CashOut,
    tokenSymbol: 'CELO',
  })

  beforeEach(() => {
    jest.clearAllMocks()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('displays correctly for cUSD when local currency is USD', () => {
    const { getByText } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(getByText('amount (cUSD)')).toBeTruthy()
  })

  it('displays correctly for cEUR when local currency is USD', () => {
    const { getByText } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenPropsEuro} />
      </Provider>
    )
    expect(getByText('amount (cEUR)')).toBeTruthy()
  })

  it('displays correctly for CELO when local currency is USD', () => {
    const { getByText } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenPropsCelo} />
      </Provider>
    )
    expect(getByText('amount (CELO)')).toBeTruthy()
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
      amount: {
        fiat: 750,
        crypto: 750,
      },
      tokenId: mockCusdTokenId,
    })
  })
  it('calls dispatch attemptReturnUserFlow when there is a previously linked fiatconnect account', () => {
    const store = createMockStore({
      localCurrency: {
        fetchedCurrencyCode: LocalCurrencyCode.USD,
        preferredCurrencyCode: LocalCurrencyCode.USD,
        usdToLocalRate: usdToUsdRate,
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
      tokenId: mockCusdTokenId,
      flow: CICOFlow.CashOut,
      tokenSymbol: 'cUSD',
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
        selectedCrypto: 'cUSD',
        amount: {
          crypto: 750,
          fiat: 750,
        },
        providerId: 'provider-two',
        fiatAccountId: '123',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
        tokenId: mockCusdTokenId,
      })
    )
  })
  it('calls dispatch attemptReturnUserFlow when there is a previously linked fiatconnect account that used a different flow', () => {
    const store = createMockStore({
      localCurrency: {
        fetchedCurrencyCode: LocalCurrencyCode.USD,
        preferredCurrencyCode: LocalCurrencyCode.USD,
        usdToLocalRate: usdToUsdRate,
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
      tokenId: mockCusdTokenId,
      flow: CICOFlow.CashOut,
      tokenSymbol: 'cUSD',
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
        selectedCrypto: 'cUSD',
        amount: {
          crypto: 750,
          fiat: 750,
        },
        providerId: 'provider-two',
        fiatAccountId: '123',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
        tokenId: mockCusdTokenId,
      })
    )
  })
})
