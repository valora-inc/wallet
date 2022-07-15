import { generateOnRampURL } from '@coinbase/cbpay-js'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import { CoinbasePayEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  CoinbasePaymentSection,
  CoinbasePaymentSectionProps,
} from 'src/fiatExchanges/CoinbasePaymentSection'
import { PaymentMethod } from 'src/fiatExchanges/utils'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import { navigate } from 'src/navigator/NavigationService'
import { CiCoCurrency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import { mockProviders } from 'test/values'
import { mocked } from 'ts-jest/utils'

const restrictedCurrencies = [CiCoCurrency.CEUR, CiCoCurrency.CUSD]
const FAKE_APP_ID = 'fake app id'
const FAKE_URL = 'www.coinbasepay.test'

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('@coinbase/cbpay-js', () => ({
  generateOnRampURL: jest.fn(),
}))

jest.mock('src/firebase/firebase', () => ({
  readOnceFromFirebase: jest.fn(),
}))

// TODO - add tests to check for allowed digitalAsset
describe('CoinbasePaymentSection', () => {
  let props: CoinbasePaymentSectionProps
  let mockStore: MockStoreEnhanced
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    props = {
      digitalAsset: CiCoCurrency.CELO,
      cryptoAmount: 10,
      coinbaseProvider: mockProviders.find((quote) =>
        quote.paymentMethods.includes(PaymentMethod.Coinbase)
      )!,
    }
    mockStore = createMockStore({
      app: {
        coinbasePayEnabled: false,
      },
    })
  })
  it('shows nothing if coinbase is restricted and feature flag is false', async () => {
    props.coinbaseProvider!.restricted = true
    const { queryByText } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    expect(queryByText('Coinbase Pay')).toBeFalsy()
  })
  it('shows nothing if coinbase is not restricted but feature flag is false', async () => {
    mocked(readOnceFromFirebase).mockResolvedValue(FAKE_APP_ID)
    props.coinbaseProvider!.restricted = false
    const { queryByText } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    expect(queryByText('Coinbase Pay')).toBeFalsy()
  })
  it('shows nothing if coinbase is restricted and feature flag is true', async () => {
    props.coinbaseProvider!.restricted = true
    mockStore = createMockStore({
      ...mockStore,
      app: {
        coinbasePayEnabled: true,
      },
    })
    const { queryByText } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    expect(queryByText('Coinbase Pay')).toBeFalsy()
  })
  it('shows card if coinbase is not restricted, feature flag is true, and CELO is selected', async () => {
    mocked(readOnceFromFirebase).mockResolvedValue(FAKE_APP_ID)
    mocked(generateOnRampURL).mockReturnValue(FAKE_URL)
    props.coinbaseProvider!.restricted = false
    mockStore = createMockStore({
      ...mockStore,
      app: {
        coinbasePayEnabled: true,
      },
    })
    const { queryByText } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    await waitFor(() => expect(queryByText('Coinbase Pay')).toBeTruthy())
  })

  restrictedCurrencies.forEach((currency) => {
    it('shows nothing if ' + currency + ' is selected', async () => {
      props.coinbaseProvider!.restricted = false
      props.digitalAsset = currency
      mockStore = createMockStore({
        ...mockStore,
        app: {
          coinbasePayEnabled: true,
        },
      })
      const { queryByText } = render(
        <Provider store={mockStore}>
          <CoinbasePaymentSection {...props} />
        </Provider>
      )
      expect(queryByText('Coinbase Pay')).toBeFalsy()
    })
  })

  it('navigates to coinbase flow when card is pressed', async () => {
    mocked(readOnceFromFirebase).mockResolvedValue(FAKE_APP_ID)
    mocked(generateOnRampURL).mockReturnValue(FAKE_URL)
    props.coinbaseProvider!.restricted = false
    mockStore = createMockStore({
      ...mockStore,
      app: {
        coinbasePayEnabled: true,
      },
    })
    const { getByTestId, queryByText } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    await waitFor(() => expect(queryByText('Coinbase Pay')).toBeTruthy())
    fireEvent.press(getByTestId('coinbasePayCard'))
    await waitFor(() => {
      expect(ValoraAnalytics.track).toBeCalledWith(CoinbasePayEvents.coinbase_pay_flow_start)
      expect(navigate).toBeCalled()
    })
  })
})
