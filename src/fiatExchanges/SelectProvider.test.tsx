import { render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import SelectProviderScreen from 'src/fiatExchanges/SelectProvider'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockExchanges, mockFiatConnectQuotes, mockProviders } from 'test/values'
import { mocked } from 'ts-jest/utils'
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
const restrictedCurrencies = [Currency.Euro, Currency.Dollar]

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
  selectedCrypto: Currency = Currency.Dollar
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
  })

  it('calls fetchProviders correctly', async () => {
    render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() =>
      expect(fetchProviders).toHaveBeenCalledWith({
        digitalAsset: CiCoCurrency.CUSD,
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
    mocked(fetchProviders).mockResolvedValue(mockProviders)
    mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    mockStore = createMockStore({
      ...MOCK_STORE_DATA,
      fiatConnect: {
        quotesError: null,
        quotesLoading: false,
        quotes: [mockFiatConnectQuotes[4]],
      },
    })
    const { queryByText, getByTestId } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())

    expect(queryByText('selectProviderScreen.bank')).toBeTruthy()
    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByText('selectProviderScreen.mobileMoney')).toBeTruthy()
    expect(queryByText('selectProviderScreen.cryptoExchange')).toBeTruthy()
    expect(getByTestId('LegacyMobileMoneySection')).toBeTruthy()

    // Not visible because bank, card and fiat connect mobile money have providers
    expect(queryByText('selectProviderScreen.somePaymentsUnavailable')).toBeFalsy()
  })
  it('shows the limit payment methods dialog when one of the provider types has no options', async () => {
    mocked(fetchProviders).mockResolvedValue([mockProviders[2]])
    mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    const { queryByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())
    // Visible because there are no card providers
    expect(queryByText('selectProviderScreen.learnMore')).toBeTruthy()
  })
  it('does not show exchange section if no exchanges', async () => {
    mocked(fetchProviders).mockResolvedValue(mockProviders)
    mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    mocked(fetchExchanges).mockResolvedValue([])
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
    mocked(fetchProviders).mockResolvedValue([])
    mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue([])
    mocked(fetchExchanges).mockResolvedValue([])
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

  describe('SelectProviderScreen CBPay Card', () => {
    beforeEach(() => {
      jest.useRealTimers()
      jest.clearAllMocks()
      mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
      mocked(fetchExchanges).mockResolvedValue(mockExchanges)
    })
    it('does not show coinbase card if coinbase is restricted and feature flag is false', async () => {
      const mockProvidersAdjusted = mockProviders
      mockProvidersAdjusted.find((provider) => provider.name === 'CoinbasePay')!.restricted = true
      mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)

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
      mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
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
      mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
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
      mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
      mockStore = createMockStore({
        ...mockStore,
        app: {
          coinbasePayEnabled: true,
        },
      })
      const { queryByText } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps(CICOFlow.CashIn, Currency.Celo)} />
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
        mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
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
      mocked(fetchProviders).mockResolvedValue(mockProvidersAdjusted)
      mockStore = createMockStore({
        ...mockStore,
        app: {
          coinbasePayEnabled: true,
        },
      })
      const { queryByText } = render(
        <Provider store={mockStore}>
          <SelectProviderScreen {...mockScreenProps(CICOFlow.CashOut, Currency.Celo)} />
        </Provider>
      )
      await waitFor(() => expect(queryByText('Coinbase Pay')).toBeFalsy())
    })
  })
})
