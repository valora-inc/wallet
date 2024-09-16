import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import SimplexScreen from 'src/fiatExchanges/SimplexScreen'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { CiCoCurrency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockCusdTokenId, mockE164Number } from 'test/values'
import { v4 as uuidv4 } from 'uuid'
import { SimplexQuote } from './utils'

const mockUserIpAddress = '1.1.1.1.1.1.0'

const MOCK_SIMPLEX_PAYMENT_REQUEST_RESPONSE = JSON.stringify({
  is_kyc_update_required: false,
  paymentId: '123',
})

const mockStore = createMockStore({
  web3: {
    account: mockAccount,
  },
  account: {
    e164PhoneNumber: mockE164Number,
    defaultCountryCode: '+1',
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.USD,
  },
  networkInfo: {
    userLocationData: {
      ipAddress: mockUserIpAddress,
    },
  },
})

const MOCK_SIMPLEX_QUOTE = {
  user_id: mockAccount,
  quote_id: uuidv4(),
  wallet_id: 'appname',
  digital_money: {
    currency: 'CUSD',
    amount: 25,
  },
  fiat_money: {
    currency: 'USD',
    base_amount: 19,
    total_amount: 26,
  },
  valid_until: new Date().toISOString(),
  supported_digital_currencies: ['CUSD', 'CELO'],
  tokenId: mockCusdTokenId,
}

const mockScreenProps = () =>
  getMockStackScreenProps(Screens.Simplex, {
    simplexQuote: MOCK_SIMPLEX_QUOTE as SimplexQuote,
    tokenId: mockCusdTokenId,
  })

describe('SimplexScreen', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('renders correctly', async () => {
    const tree = render(
      <Provider store={mockStore}>
        <SimplexScreen {...mockScreenProps()} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    mockFetch.mockResponseOnce(MOCK_SIMPLEX_PAYMENT_REQUEST_RESPONSE)
    await waitFor(() => tree.getByText(/continueToProvider/))
    tree.rerender(
      <Provider store={mockStore}>
        <SimplexScreen {...mockScreenProps()} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('fires an analytics event', async () => {
    mockFetch.mockResponseOnce(MOCK_SIMPLEX_PAYMENT_REQUEST_RESPONSE)

    const tree = render(
      <Provider store={mockStore}>
        <SimplexScreen {...mockScreenProps()} />
      </Provider>
    )

    await waitFor(() => tree.getByText(/continueToProvider/))

    fireEvent.press(tree.getByText(/continueToProvider/))
    expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_simplex_open_webview, {
      amount: 25,
      cryptoCurrency: CiCoCurrency.cUSD,
      feeInFiat: 7,
      fiatCurrency: 'USD',
    })
  })
})
