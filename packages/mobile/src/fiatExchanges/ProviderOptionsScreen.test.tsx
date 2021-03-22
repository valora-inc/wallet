import { CURRENCY_ENUM } from '@celo/utils'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Text } from 'react-native'
import { fireEvent, render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { CurrencyCode } from 'src/config'
import ProviderOptionsScreen from 'src/fiatExchanges/ProviderOptionsScreen'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount } from 'test/values'
import { v4 as uuidv4 } from 'uuid'

const AMOUNT_TO_CASH_IN = 100

const mockScreenProps = (isCashIn: boolean) =>
  getMockStackScreenProps(Screens.ProviderOptionsScreen, {
    isCashIn,
    selectedCrypto: CURRENCY_ENUM.DOLLAR,
    amount: {
      crypto: AMOUNT_TO_CASH_IN,
      fiat: AMOUNT_TO_CASH_IN,
    },
  })

const mockStore = createMockStore({
  account: {
    defaultCountryCode: '+54',
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.BRL,
  },
})

const mockIpAddress = '1.1.1.1.1.0'

const UNRESTRICTED_USER_LOCATION = JSON.stringify({
  alpha2: 'MX',
  state: null,
  ipAddress: mockIpAddress,
})

const MIXED_RESTRICTION_USER_LOCATION = JSON.stringify({
  alpha2: 'US',
  state: 'CA',
  ipAddress: mockIpAddress,
})

const RESTRICTED_USER_LOCATION = JSON.stringify({
  alpha2: 'KP',
  state: null,
  ipAddress: mockIpAddress,
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

const MOCK_SIMPLEX_QUOTE_FETCH_RESPONSE = JSON.stringify(MOCK_SIMPLEX_QUOTE)

describe('ProviderOptionsScreen', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('renders correctly', async () => {
    mockFetch.mockResponseOnce(MIXED_RESTRICTION_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    await waitForElement(() => tree.getByText('pleaseSelectProvider'))
    expect(tree).toMatchSnapshot()
  })

  it('opens Simplex correctly', async () => {
    mockFetch.mockResponses(UNRESTRICTED_USER_LOCATION, MOCK_SIMPLEX_QUOTE_FETCH_RESPONSE)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Simplex'))
    expect(navigate).toHaveBeenCalledWith(Screens.Simplex, {
      simplexQuote: MOCK_SIMPLEX_QUOTE,
      userIpAddress: mockIpAddress,
    })
  })

  it('opens MoonPay correctly', async () => {
    mockFetch.mockResponseOnce(UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Moonpay'))
    expect(navigate).toHaveBeenCalledWith(Screens.MoonPayScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CurrencyCode.CUSD,
    })
  })

  it('opens Ramp correctly', async () => {
    mockFetch.mockResponseOnce(UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Ramp'))
    expect(navigate).toHaveBeenCalledWith(Screens.RampScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CurrencyCode.CUSD,
    })
  })

  it('opens Transak correctly', async () => {
    mockFetch.mockResponseOnce(UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Transak'))
    expect(navigate).toHaveBeenCalledWith(Screens.TransakScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CurrencyCode.CUSD,
    })
  })

  it('moves available providers to the top of the list', async () => {
    mockFetch.mockResponses(MIXED_RESTRICTION_USER_LOCATION, MOCK_SIMPLEX_QUOTE_FETCH_RESPONSE)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByType(Text)
    // The first text element is the info, the second text element is the first provider
    expect(elements[1].props.children).toEqual('Simplex')
  })

  it('moves unavailable providers to the bottom of the list', async () => {
    mockFetch.mockResponseOnce(UNRESTRICTED_USER_LOCATION)
    // The only quote endpoint is currently Simplex's so it's
    // the only provider that can be disabled
    mockFetch.mockReject(new Error('API fetch failed'))

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByType(Text)
    // The last few text elements belong to the modal + subtext for the last provider
    const lastProviderName = elements[elements.length - 5].props.children
    expect(lastProviderName).toEqual('Simplex')
  })

  it('disables a provider if they are unavailable', async () => {
    mockFetch.mockResponseOnce(UNRESTRICTED_USER_LOCATION)
    // The only quote endpoint is currently Simplex's sp it's
    // the only provider that can be disabled
    mockFetch.mockReject(new Error('API fetch failed'))

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByText('providerUnavailable')
    expect(elements).toHaveLength(1)
    fireEvent.press(tree.getByTestId('Provider/Simplex'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows a warning if user region is not supported', async () => {
    mockFetch.mockResponseOnce(RESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByText('restrictedRegion')
    expect(elements).not.toHaveLength(0)
  })

  it('does not show a warning if user region is supported', async () => {
    mockFetch.mockResponseOnce(UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByText('restrictedRegion')
    expect(elements).toHaveLength(0)
  })

  it('uses country code if IP address endpoint errors', async () => {
    mockFetch.mockReject(new Error('API fetch failed'))

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const element = tree.queryByText('restrictedRegion')
    expect(element).toBeNull()
  })
})
