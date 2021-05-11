import { CURRENCY_ENUM } from '@celo/utils'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Text } from 'react-native'
import { fireEvent, render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import ProviderOptionsScreen, { CicoProvider } from 'src/fiatExchanges/ProviderOptionsScreen'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount } from 'test/values'
import { v4 as uuidv4 } from 'uuid'

const AMOUNT_TO_CASH_IN = 100

const mockScreenProps = (
  isCashIn: boolean,
  paymentMethod: PaymentMethod.Card | PaymentMethod.Bank
) =>
  getMockStackScreenProps(Screens.ProviderOptionsScreen, {
    isCashIn,
    selectedCrypto: CURRENCY_ENUM.DOLLAR,
    amount: {
      crypto: AMOUNT_TO_CASH_IN,
      fiat: AMOUNT_TO_CASH_IN,
    },
    paymentMethod,
  })

const mockStore = createMockStore({
  account: {
    // North Korea country code
    defaultCountryCode: '+850',
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.USD,
  },
})

const MOCK_IP_ADDRESS = '1.1.1.1.1.0'

const MOCK_USER_LOCATION = JSON.stringify({
  alpha2: 'MX',
  state: null,
  ipAddress: MOCK_IP_ADDRESS,
})

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

export const mockProviders: CicoProvider[] = [
  {
    name: 'Simplex',
    restricted: false,
    unavailable: false,
    paymentMethods: [PaymentMethod.Card],
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
    quote: MOCK_SIMPLEX_QUOTE,
    cashIn: true,
    cashOut: false,
  },
  {
    name: 'Moonpay',
    restricted: false,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'https://www.moonpay.com/',
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
    cashIn: true,
    cashOut: false,
  },
  {
    name: 'Ramp',
    restricted: false,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
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
    cashIn: true,
    cashOut: true,
  },
  {
    name: 'Transak',
    restricted: false,
    unavailable: true,
    paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
    url: 'www.fakewebsite.com',
    logo:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
    cashIn: true,
    cashOut: false,
  },
]

const MOCK_PROVIDER_FETCH = JSON.stringify(mockProviders)

describe('ProviderOptionsScreen', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('renders correctly', async () => {
    mockFetch.mockResponses(MOCK_USER_LOCATION, MOCK_PROVIDER_FETCH)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true, PaymentMethod.Card)} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    await waitForElement(() => tree.getByText('pleaseSelectProvider'))
    expect(tree).toMatchSnapshot()
  })

  it('opens Simplex correctly', async () => {
    mockFetch.mockResponses(MOCK_USER_LOCATION, MOCK_PROVIDER_FETCH)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true, PaymentMethod.Card)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Simplex'))
    expect(navigate).toHaveBeenCalledWith(Screens.Simplex, {
      simplexQuote: MOCK_SIMPLEX_QUOTE,
      userIpAddress: MOCK_IP_ADDRESS,
    })
  })

  it('opens a non-integrated provider correctly', async () => {
    mockFetch.mockResponses(MOCK_USER_LOCATION, MOCK_PROVIDER_FETCH)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true, PaymentMethod.Card)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Moonpay'))
    expect(navigateToURI).toHaveBeenCalledWith(mockProviders[1].url)
  })

  it('moves available providers to the top of the list', async () => {
    mockFetch.mockResponses(MOCK_USER_LOCATION, MOCK_PROVIDER_FETCH)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true, PaymentMethod.Card)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByType(Text)
    // The first text element is the info, the second text element is the first provider
    expect(elements[1].props.children).toEqual('Simplex')
  })

  it('moves unavailable providers to the bottom of the list', async () => {
    mockFetch.mockResponses(MOCK_USER_LOCATION, MOCK_PROVIDER_FETCH)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true, PaymentMethod.Card)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByType(Text)
    // The last few text elements belong to the modal + subtext for the last provider
    const lastProviderName = elements[elements.length - 5].props.children
    expect(lastProviderName).toEqual('Transak')
  })

  it('disables a provider if they are unavailable', async () => {
    mockFetch.mockResponses(MOCK_USER_LOCATION, MOCK_PROVIDER_FETCH)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true, PaymentMethod.Card)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByText('providerUnavailable')
    expect(elements).toHaveLength(1)
    fireEvent.press(tree.getByTestId('Provider/Transak'))
    expect(navigateToURI).not.toHaveBeenCalled()
  })

  it('shows a warning if user region is not supported', async () => {
    mockFetch.mockResponses(MOCK_USER_LOCATION, MOCK_PROVIDER_FETCH)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true, PaymentMethod.Card)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByText('restrictedRegion')
    // Only Xanpool is restricted in mock
    expect(elements).toHaveLength(1)
  })

  it('shows a warning if the selected payment method is not supported', async () => {
    mockFetch.mockResponses(MOCK_USER_LOCATION, MOCK_PROVIDER_FETCH)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true, PaymentMethod.Bank)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByText('unsupportedPaymentMethod')
    // Only Simplex doesn't support bank accounts
    expect(elements).toHaveLength(1)
  })
})
