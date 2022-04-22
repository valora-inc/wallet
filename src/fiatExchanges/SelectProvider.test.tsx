import SelectProviderScreen, { PaymentMethodSection } from 'src/fiatExchanges/SelectProvider'
import { render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount } from 'test/values'
import { Provider } from 'react-redux'
import {
  CICOFlow,
  fetchLocalCicoProviders,
  fetchProviders,
  FetchProvidersOutput,
  LocalCicoProvider,
  PaymentMethod,
} from './utils'
import { mocked } from 'ts-jest/utils'
import { v4 as uuidv4 } from 'uuid'

const AMOUNT_TO_CASH_IN = 100
const MOCK_IP_ADDRESS = '1.1.1.7'

jest.mock('./utils', () => ({
  ...(jest.requireActual('./utils') as any),
  fetchProviders: jest.fn(),
  fetchLocalCicoProviders: jest.fn(),
}))

const MOCK_SIMPLEX_QUOTE = {
  user_id: mockAccount,
  quote_id: uuidv4(),
  wallet_id: 'valorapp',
  digital_money: {
    currency: 'CUSD',
    amount: 25,
  },
  fiat_money: {
    currency: 'USD',
    base_amount: 19,
    total_amount: 6,
  },
  valid_until: new Date().toISOString(),
  supported_digital_currencies: ['CUSD', 'CELO'],
}

const mockProviders: FetchProvidersOutput[] = [
  {
    name: 'Simplex',
    restricted: false,
    unavailable: false,
    paymentMethods: [PaymentMethod.Card],
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: false,
    quote: MOCK_SIMPLEX_QUOTE,
  },
  {
    name: 'Moonpay',
    restricted: false,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'https://www.moonpay.com/',
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: false,
    quote: [
      { paymentMethod: PaymentMethod.Bank, digitalAsset: 'cusd', returnedAmount: 95, fiatFee: 5 },
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 90, fiatFee: 10 },
    ],
  },
  {
    name: 'Ramp',
    restricted: false,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    quote: [
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 100, fiatFee: 0 },
    ],
    cashIn: true,
    cashOut: false,
  },
  {
    name: 'Xanpool',
    restricted: true,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fxanpool.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: true,
    quote: [
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 97, fiatFee: 3 },
    ],
  },
  {
    name: 'Transak',
    restricted: false,
    unavailable: true,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
    logoWide:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    cashIn: true,
    cashOut: false,
    quote: [
      { paymentMethod: PaymentMethod.Bank, digitalAsset: 'cusd', returnedAmount: 94, fiatFee: 6 },
      { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 88, fiatFee: 12 },
    ],
  },
]

const mockLocalProviders: LocalCicoProvider[] = [
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
    mocked(fetchLocalCicoProviders).mockResolvedValue(mockLocalProviders)
    const { queryByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLocalCicoProviders).toHaveBeenCalled())

    expect(queryByText('selectProviderScreen.bank')).toBeTruthy()
    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByText('selectProviderScreen.cryptoExchange')).toBeTruthy()
    expect(queryByText('selectProviderScreen.mobileMoney')).toBeTruthy()

    // Not visible because bank & card both have providers
    expect(queryByText('selectProviderScreen.somePaymentsUnavailable')).toBeFalsy()
  })
  it('shows the limit payment methods dialog when one of the provider types has no options', async () => {
    mocked(fetchProviders).mockResolvedValue([mockProviders[2]])
    mocked(fetchLocalCicoProviders).mockResolvedValue(mockLocalProviders)
    const { queryByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLocalCicoProviders).toHaveBeenCalled())
    // Visible because there are no card providers
    expect(queryByText('selectProviderScreen.learnMore')).toBeTruthy()
  })
})

describe(PaymentMethodSection, () => {
  it('shows nothing if there are no available providers', async () => {
    mocked(fetchProviders).mockResolvedValue([])
    mocked(fetchLocalCicoProviders).mockResolvedValue(mockLocalProviders)
    const { queryByText } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLocalCicoProviders).toHaveBeenCalled())

    expect(queryByText('selectProviderScreen.bank')).toBeFalsy()
    expect(queryByText('selectProviderScreen.card')).toBeFalsy()
  })
  it('shows a non-expandable view if there is one provider available', async () => {
    mocked(fetchProviders).mockResolvedValue([mockProviders[2]])
    mocked(fetchLocalCicoProviders).mockResolvedValue(mockLocalProviders)
    const { queryByText, queryByTestId } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLocalCicoProviders).toHaveBeenCalled())
    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByTestId(`image-Ramp`)).toBeTruthy()
  })
  it('shows an expandable view if there is more than one provider available', async () => {
    mocked(fetchProviders).mockResolvedValue(mockProviders)
    mocked(fetchLocalCicoProviders).mockResolvedValue(mockLocalProviders)
    const { queryByText, queryByTestId } = render(
      <Provider store={mockStore}>
        <SelectProviderScreen {...mockScreenProps()} />
      </Provider>
    )
    await waitFor(() => expect(fetchLocalCicoProviders).toHaveBeenCalled())

    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByText('selectProviderScreen.numProviders, {"count":3}')).toBeTruthy()
    expect(queryByTestId(`image-Ramp`)).toBeFalsy()
  })
})
