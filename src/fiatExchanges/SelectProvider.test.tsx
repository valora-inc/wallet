import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import SelectProviderScreen from 'src/fiatExchanges/SelectProvider'
import { SelectProviderExchangesLink, SelectProviderExchangesText } from 'src/fiatExchanges/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams, getFeatureGate } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockExchanges, mockFiatConnectQuotes, mockProviders } from 'test/values'
import {
  CICOFlow,
  fetchExchanges,
  fetchLegacyMobileMoneyProviders,
  fetchProviders,
  LegacyMobileMoneyProvider,
} from './utils'

const AMOUNT_TO_CASH_IN = 100
const MOCK_IP_ADDRESS = '1.1.1.7'
const FAKE_APP_ID = 'fake app id'
const restrictedCurrencies = [CiCoCurrency.cEUR, CiCoCurrency.cUSD]

jest.mock('./utils', () => ({
  ...(jest.requireActual('./utils') as any),
  fetchProviders: jest.fn(),
  fetchLegacyMobileMoneyProviders: jest.fn(),
  fetchExchanges: jest.fn(),
}))

jest.mock('@coinbase/cbpay-js', () => {
  return { generateOnRampURL: jest.fn() }
})

jest.mock('src/firebase/firebase', () => ({
  readOnceFromFirebase: jest.fn().mockResolvedValue(FAKE_APP_ID),
}))

jest.mock('src/statsig')

const mockLegacyProviders: LegacyMobileMoneyProvider[] = [
  {
    name: 'CryptoProvider',
    celo: {
      cashIn: true,
      cashOut: true,
      countries: ['MX'],
      url: 'https://www.fakecryptoprovider.com/celo',
    },
    cusd: {
      cashIn: true,
      cashOut: true,
      countries: ['MX'],
      url: 'https://www.fakecryptoprovider.com/celo',
    },
  },
]

const mockScreenProps = (
  flow: CICOFlow = CICOFlow.CashIn,
  selectedCrypto: CiCoCurrency = CiCoCurrency.cUSD
) =>
  getMockStackScreenProps(Screens.SelectProvider, {
    flow,
    selectedCrypto,
    amount: {
      crypto: AMOUNT_TO_CASH_IN,
      fiat: AMOUNT_TO_CASH_IN,
    },
  })

const MOCK_STORE_DATA = {
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.USD,
  },
  networkInfo: {
    userLocationData: {
      countryCodeAlpha2: 'MX',
      region: null,
      ipAddress: MOCK_IP_ADDRESS,
    },
  },
  web3: {
    account: mockAccount,
  },
  fiatConnect: {
    quotesError: null,
    quotesLoading: false,
    quotes: [],
  },
  app: {
    coinbasePayEnabled: false,
  },
}

describe(SelectProviderScreen, () => {
  const mockFetch = fetch as FetchMock
  let mockStore: MockStoreEnhanced
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
    mockStore = createMockStore(MOCK_STORE_DATA)
    jest.mocked(getExperimentParams).mockReturnValue({
      addFundsExchangesText: SelectProviderExchangesText.CryptoExchange,
      addFundsExchangesLink: SelectProviderExchangesLink.ExternalExchangesScreen,
    })
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('calls fetchProviders correctly', async () => {
    render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() =>
      expect(fetchProviders).toHaveBeenCalledWith({
        digitalAsset: 'CUSD',
        digitalAssetAmount: AMOUNT_TO_CASH_IN,
        fiatAmount: AMOUNT_TO_CASH_IN,
        fiatCurrency: LocalCurrencyCode.USD,
        txType: 'buy',
        userLocation: {
          countryCodeAlpha2: 'MX',
          region: null,
          ipAddress: MOCK_IP_ADDRESS,
        },
        walletAddress: mockAccount.toLowerCase(),
      })
    )
  })
  it('calls fetchExchanges correctly', async () => {
    render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchExchanges).toHaveBeenCalledWith('MX', Currency.Dollar))
  })
  it('shows the provider sections (bank, card, mobile money), legacy mobile money, and exchange section', async () => {
    jest.mocked(fetchProviders).mockResolvedValue(mockProviders)
    jest.mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    jest.mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    mockStore = createMockStore({
      ...MOCK_STORE_DATA,
      fiatConnect: {
        quotesError: null,
        quotesLoading: false,
        quotes: [mockFiatConnectQuotes[4]],
      },
    })
    const { queryByTestId, queryByText, getByTestId, getByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())

    expect(getByText('selectProviderScreen.bank')).toBeTruthy()
    expect(getByText('selectProviderScreen.card')).toBeTruthy()
    expect(getByText('selectProviderScreen.mobileMoney')).toBeTruthy()
    expect(getByTestId('Exchanges')).toBeTruthy()
    expect(getByTestId('LegacyMobileMoneySection')).toBeTruthy()

    expect(queryByText('selectProviderScreen.somePaymentsUnavailable')).toBeFalsy()
    expect(getByText('selectProviderScreen.disclaimer')).toBeTruthy()
    expect(queryByTestId('AmountSpentInfo')).toBeFalsy()
  })
  it('shows you will pay fiat amount for cash ins if feature flag is true', async () => {
    jest.mocked(fetchProviders).mockResolvedValue(mockProviders)
    jest.mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    jest.mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    jest.mocked(getFeatureGate).mockReturnValue(true)
    mockStore = createMockStore({
      ...MOCK_STORE_DATA,
      fiatConnect: {
        quotesError: null,
        quotesLoading: false,
        quotes: [mockFiatConnectQuotes[4]],
      },
    })
    const { getByTestId, getByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())

    expect(getByTestId('AmountSpentInfo')).toBeTruthy()
    expect(getByText(/selectProviderScreen.cashIn.amountSpentInfo/)).toBeTruthy()
    expect(getByTestId('AmountSpentInfo/Fiat/value')).toBeTruthy()
  })
  it('shows you will withdraw crypto amount for cash outs if feature flag is true', async () => {
    jest.mocked(fetchProviders).mockResolvedValue(mockProviders)
    jest.mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    jest.mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    jest.mocked(getFeatureGate).mockReturnValue(true)
    mockStore = createMockStore({
      ...MOCK_STORE_DATA,
      fiatConnect: {
        quotesError: null,
        quotesLoading: false,
        quotes: [mockFiatConnectQuotes[4]],
      },
    })
    const { getByTestId, getByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps(CICOFlow.CashOut)} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())

    expect(getByTestId('AmountSpentInfo')).toBeTruthy()
    expect(getByText(/selectProviderScreen.cashOut.amountSpentInfo/)).toBeTruthy()
    expect(getByTestId('AmountSpentInfo/Crypto')).toBeTruthy()
  })
  it('shows the limit payment methods dialog when one of the provider types has no options', async () => {
    jest.mocked(fetchProviders).mockResolvedValue([mockProviders[2]])
    jest.mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    jest.mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    const { getByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())
    // Visible because there are no card providers
    expect(getByText('selectProviderScreen.disclaimerWithSomePaymentsUnavailable')).toBeTruthy()
  })
  it('does not show exchange section if no exchanges', async () => {
    jest.mocked(fetchProviders).mockResolvedValue(mockProviders)
    jest.mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    jest.mocked(fetchExchanges).mockResolvedValue([])
    const { queryByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())

    // Exchange card is not visible as no exchanges are available
    expect(queryByText('selectProviderScreen.cryptoExchange')).toBeFalsy()
  })
  it('shows no payment screen when no providers or exchanges are available', async () => {
    jest.mocked(fetchProviders).mockResolvedValue([])
    jest.mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue([])
    jest.mocked(fetchExchanges).mockResolvedValue([])
    const { queryByText, getByTestId } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())

    // Only no payment method screen components are visible when no exchanges or providers are available
    expect(getByTestId('NoPaymentMethods')).toBeTruthy()
    expect(queryByText('selectProviderScreen.bank')).toBeFalsy()
    expect(queryByText('selectProviderScreen.card')).toBeFalsy()
    expect(queryByText('selectProviderScreen.cryptoExchange')).toBeFalsy()
    expect(queryByText('selectProviderScreen.mobileMoney')).toBeFalsy()
  })

  describe('Exchanges section', () => {
    beforeAll(() => {
      jest.mocked(fetchProviders).mockResolvedValue([])
      jest.mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue([])
      jest.mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    })

    it('renders crypto exchange and navigates to exchanges screen regardless of statsig param for cash outs', async () => {
      jest.mocked(getExperimentParams).mockReturnValue({
        addFundsExchangesText: SelectProviderExchangesText.DepositFrom,
        addFundsExchangesLink: SelectProviderExchangesLink.ExchangeQRScreen,
      })
      const { queryByText, getByText, getByTestId } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps(CICOFlow.CashOut)} />
        </Provider>
      )
      await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())
      expect(getByTestId('Exchanges')).toBeTruthy()
      expect(queryByText('selectProviderScreen.cryptoExchange')).toBeTruthy()
      expect(queryByText('selectProviderScreen.feesVary')).toBeTruthy()
      expect(queryByText('selectProviderScreen.viewExchanges')).toBeTruthy()
      expect(queryByText('selectProviderScreen.depositFrom')).toBeFalsy()
      expect(queryByText('selectProviderScreen.cryptoExchangeOrWallet')).toBeFalsy()
      expect(getExperimentParams).not.toHaveBeenCalled()

      fireEvent.press(getByText('selectProviderScreen.viewExchanges'))
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.ExternalExchanges, {
        currency: Currency.Dollar,
        isCashIn: false,
        exchanges: mockExchanges,
      })
    })

    it('renders based on params from statsig for cash ins', async () => {
      jest.mocked(getExperimentParams).mockReturnValue({
        addFundsExchangesText: SelectProviderExchangesText.DepositFrom,
        addFundsExchangesLink: SelectProviderExchangesLink.ExchangeQRScreen,
      })
      const { queryByText, getByText, getByTestId } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps()} />
        </Provider>
      )
      await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())
      expect(getByTestId('Exchanges')).toBeTruthy()
      expect(queryByText('selectProviderScreen.cryptoExchange')).toBeFalsy()
      expect(queryByText('selectProviderScreen.feesVary')).toBeFalsy()
      expect(queryByText('selectProviderScreen.viewExchanges')).toBeFalsy()
      expect(queryByText('selectProviderScreen.depositFrom')).toBeTruthy()
      expect(queryByText('selectProviderScreen.cryptoExchangeOrWallet')).toBeTruthy()
      expect(getExperimentParams).toHaveBeenCalledTimes(1)
      expect(getExperimentParams).toHaveBeenCalledWith(
        ExperimentConfigs[StatsigExperiments.ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE]
      )

      fireEvent.press(getByText('selectProviderScreen.cryptoExchangeOrWallet'))
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.ExchangeQR, {
        flow: CICOFlow.CashIn,
        exchanges: mockExchanges,
      })
    })
  })

  describe('SelectProviderScreen CBPay Card', () => {
    beforeEach(() => {
      jest.useRealTimers()
      jest.clearAllMocks()
      jest.mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
      jest.mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    })
    it('does not show coinbase card if coinbase is restricted and feature flag is false', async () => {
      const mockProvidersAdjusted = mockProviders
      mockProvidersAdjusted.find((provider) => provider.name === 'CoinbasePay')!.restricted = true
      jest.mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)

      const { queryByText } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps()} />
        </Provider>
      )
      await waitFor(() => expect(queryByText('Coinbase Pay')).toBeFalsy())
    })
    it('does not show coinbase card if coinbase is not restricted but feature flag is false', async () => {
      const mockProvidersAdjusted = mockProviders
      mockProvidersAdjusted.find((provider) => provider.name === 'CoinbasePay')!.restricted = false
      jest.mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
      const { queryByText } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps()} />
        </Provider>
      )
      await waitFor(() => expect(queryByText('Coinbase Pay')).toBeFalsy())
    })
    it('does not show coinbase card if coinbase is restricted and feature flag is true', async () => {
      const mockProvidersAdjusted = mockProviders
      mockProvidersAdjusted.find((provider) => provider.name === 'CoinbasePay')!.restricted = true
      jest.mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
      mockStore = createMockStore({
        ...MOCK_STORE_DATA,
        app: {
          coinbasePayEnabled: true,
        },
      })
      const { queryByText } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps()} />
        </Provider>
      )
      await waitFor(() => expect(queryByText('Coinbase Pay')).toBeFalsy())
    })
    it('shows coinbase card if coinbase is not restricted, feature flag is true, and CELO is selected', async () => {
      const mockProvidersAdjusted = mockProviders
      mockProvidersAdjusted.find((provider) => provider.name === 'CoinbasePay')!.restricted = false
      jest.mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
      mockStore = createMockStore({
        ...mockStore,
        app: {
          coinbasePayEnabled: true,
        },
      })
      const { queryByText } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps(CICOFlow.CashIn, CiCoCurrency.CELO)} />
        </Provider>
      )
      await waitFor(() => expect(queryByText('Coinbase Pay')).toBeTruthy())
    })

    it.each(restrictedCurrencies)(
      'does not show coinbase card if %s is selected',
      async (currency) => {
        const mockProvidersAdjusted = mockProviders
        mockProvidersAdjusted.find((provider) => provider.name === 'CoinbasePay')!.restricted =
          false
        jest.mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
        mockStore = createMockStore({
          ...mockStore,
          app: {
            coinbasePayEnabled: true,
          },
        })
        const { queryByText } = render(
          <Provider store={mockStore}>
            <SelectProviderScreen {...mockScreenProps(CICOFlow.CashIn, currency)} />
          </Provider>
        )
        await waitFor(() => expect(queryByText('Coinbase Pay')).toBeFalsy())
      }
    )

    it('does not show coinbase pay card in withdraw flow', async () => {
      const mockProvidersAdjusted = mockProviders
      mockProvidersAdjusted.find((provider) => provider.name === 'CoinbasePay')!.restricted = false
      jest.mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
      mockStore = createMockStore({
        ...mockStore,
        app: {
          coinbasePayEnabled: true,
        },
      })
      const { queryByText } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps(CICOFlow.CashOut, CiCoCurrency.CELO)} />
        </Provider>
      )
      await waitFor(() => expect(queryByText('Coinbase Pay')).toBeFalsy())
    })
  })
})
