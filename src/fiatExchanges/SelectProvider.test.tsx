import { render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import SelectProviderScreen from 'src/fiatExchanges/SelectProvider'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockProviders } from 'test/values'
import { mocked } from 'ts-jest/utils'
import {
  CICOFlow,
  fetchLegacyMobileMoneyProviders,
  fetchProviders,
  LegacyMobileMoneyProvider,
} from './utils'

const AMOUNT_TO_CASH_IN = 100
const MOCK_IP_ADDRESS = '1.1.1.7'

jest.mock('./utils', () => ({
  ...(jest.requireActual('./utils') as any),
  fetchProviders: jest.fn(),
  fetchLegacyMobileMoneyProviders: jest.fn(),
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

const mockStore = createMockStore({
  account: {
    // North Korea country code
    defaultCountryCode: '+850',
  },
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
})

describe(SelectProviderScreen, () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
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
  it('shows the provider sections, mobile money, and exchange section', async () => {
    mocked(fetchProviders).mockResolvedValue(mockProviders)
    mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    const { queryByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())

    expect(queryByText('selectProviderScreen.bank')).toBeTruthy()
    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByText('selectProviderScreen.cryptoExchange')).toBeTruthy()
    expect(queryByText('selectProviderScreen.mobileMoney')).toBeTruthy()

    // Not visible because bank & card both have providers
    expect(queryByText('selectProviderScreen.somePaymentsUnavailable')).toBeFalsy()
  })
  it('shows the limit payment methods dialog when one of the provider types has no options', async () => {
    mocked(fetchProviders).mockResolvedValue([mockProviders[2]])
    mocked(fetchLegacyMobileMoneyProviders).mockResolvedValue(mockLegacyProviders)
    const { queryByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLegacyMobileMoneyProviders).toHaveBeenCalled())
    // Visible because there are no card providers
    expect(queryByText('selectProviderScreen.learnMore')).toBeTruthy()
  })
})
