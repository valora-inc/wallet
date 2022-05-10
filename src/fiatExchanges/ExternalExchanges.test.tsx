import { fireEvent, render } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import ExternalExchanges, { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import networkConfig from 'src/geth/networkConfig'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore, flushMicrotasksQueue, getMockStackScreenProps } from 'test/utils'
import { mockAccount } from 'test/values'

const mockStore = createMockStore({
  web3: {
    account: mockAccount,
  },
  networkInfo: {
    userLocationData: {
      countryCodeAlpha2: 'US',
      region: null,
      ipAddress: null,
    },
  },
})

const MOCK_EXCHANGES_FETCH_RESPONSE: ExternalExchangeProvider[] = [
  {
    name: 'Bittrex',
    link: 'https://bittrex.com/Market/Index?MarketName=USD-CELO',
    currencies: [Currency.Celo, Currency.Dollar],
    supportedRegions: ['global'],
  },
  {
    name: 'CoinList Pro',
    link: 'https://coinlist.co/asset/celo',
    currencies: [Currency.Celo, Currency.Dollar],
    supportedRegions: ['global'],
  },
  {
    name: 'OKCoin',
    link: 'https://www.okcoin.com/en/spot/trade/cusd-usd/',
    currencies: [Currency.Celo, Currency.Dollar],
    supportedRegions: ['global'],
  },
]

describe('ExternalExchanges', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('shows the correct UI when no provider is available', async () => {
    mockFetch.mockResponse(JSON.stringify([]), { status: 200 })
    const mockScreenProps = getMockStackScreenProps(Screens.ExternalExchanges, {
      isCashIn: true,
      currency: Currency.Celo,
    })

    const tree = render(
      <Provider store={mockStore}>
        <ExternalExchanges {...mockScreenProps} />
      </Provider>
    )

    await flushMicrotasksQueue()

    expect(tree.getByTestId('NoExchanges')).toBeTruthy()
    expect(tree.getByTestId('SwitchCurrency')).toBeTruthy()
    expect(tree.getByTestId('ContactSupport')).toBeTruthy()
  })
  it('makes a request to fetch a list of available exchanges based on geolocation and selected currency', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_EXCHANGES_FETCH_RESPONSE), { status: 200 })
    const mockScreenProps = getMockStackScreenProps(Screens.ExternalExchanges, {
      isCashIn: true,
      currency: Currency.Dollar,
    })

    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ExternalExchanges {...mockScreenProps} />
      </Provider>
    )

    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.fetchExchangesUrl}?country=US&currency=cUSD`
    )

    await flushMicrotasksQueue()
    expect(getByTestId('provider-0')).toBeTruthy()
    expect(getByTestId('provider-1')).toBeTruthy()
    expect(getByTestId('provider-2')).toBeTruthy()
    await fireEvent.press(getByTestId('provider-1'))
    expect(navigateToURI).toBeCalledWith('https://coinlist.co/asset/celo')
  })
  it('shows the correct UI when request to fetch exchanges failed', async () => {
    mockFetch.mockReject(new Error('Failed to fetch exchanges'))
    const mockScreenProps = getMockStackScreenProps(Screens.ExternalExchanges, {
      isCashIn: true,
      currency: Currency.Dollar,
    })

    const tree = render(
      <Provider store={mockStore}>
        <ExternalExchanges {...mockScreenProps} />
      </Provider>
    )

    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.fetchExchangesUrl}?country=US&currency=cUSD`
    )

    await flushMicrotasksQueue()

    expect(tree.getByTestId('NoExchanges')).toBeTruthy()
    expect(tree.getByTestId('SwitchCurrency')).toBeTruthy()
    expect(tree.getByTestId('ContactSupport')).toBeTruthy()
  })
  it('shows a loading circle when the fetch request in inflight and the loader disappears after the request is done', async () => {
    mockFetch.mockReject(new Error('Failed to fetch exchanges'))
    const mockScreenProps = getMockStackScreenProps(Screens.ExternalExchanges, {
      isCashIn: true,
      currency: Currency.Dollar,
    })

    const tree = render(
      <Provider store={mockStore}>
        <ExternalExchanges {...mockScreenProps} />
      </Provider>
    )

    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.fetchExchangesUrl}?country=US&currency=cUSD`
    )
    expect(tree.getByTestId('Loader')).toBeTruthy()

    await flushMicrotasksQueue()
    expect(tree.queryByTestId('Loader')).toBeFalsy()
  })
})
