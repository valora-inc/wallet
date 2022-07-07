import { generateOnRampURL } from '@coinbase/cbpay-js'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import {
  CoinbasePaymentSection,
  CoinbasePaymentSectionProps,
} from 'src/fiatExchanges/CoinbasePaymentSection'
import { PaymentMethod } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { CiCoCurrency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import { mockProviders } from 'test/values'
import { mocked } from 'ts-jest/utils'

const restrictedCurrencies = [CiCoCurrency.CEUR, CiCoCurrency.CUSD]

jest.mock('@coinbase/cbpay-js', () => {
  return { generateOnRampURL: jest.fn() }
})

jest.mock('src/navigator/NavigationService', () => ({
  ...(jest.requireActual('src/navigator/NavigationService') as any),
  navigate: jest.fn(),
}))

const mockOnRampURL: string = 'www.coinbasePayFlowTest.com'

// TODO - add tests to check for allowed digitalAsset
describe('CoinbasePaymentSection', () => {
  let props: CoinbasePaymentSectionProps
  let mockStore: MockStoreEnhanced
  beforeEach(() => {
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
  it('shows card if coinbase is not restricted and feature flag is true', async () => {
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
    expect(queryByText('Coinbase Pay')).toBeTruthy()
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
  it('shows card if CELO is selected and, on press, navigates to coinbase pay flow', async () => {
    props.coinbaseProvider!.restricted = false
    mockStore = createMockStore({
      ...mockStore,
      app: {
        coinbasePayEnabled: true,
      },
    })
    const { queryByText, getByTestId } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    expect(queryByText('Coinbase Pay')).toBeTruthy()
  })
  it('navigates to coinbase pay flow after pressing coinbase pay card', async () => {
    mocked(generateOnRampURL).mockReturnValue(mockOnRampURL)
    props.coinbaseProvider!.restricted = false
    mockStore = createMockStore({
      ...mockStore,
      app: {
        coinbasePayEnabled: true,
      },
    })
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    fireEvent.press(getByTestId('coinbasePayCard'))
    waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: mockOnRampURL })
    )
  })
})
