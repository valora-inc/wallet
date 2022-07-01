import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import {
  CoinbasePaymentSection,
  CoinbasePaymentSectionProps,
} from 'src/fiatExchanges/CoinbasePaymentSection'
import { PaymentMethod } from 'src/fiatExchanges/utils'
import { createMockStore } from 'test/utils'
import { mockProviders } from 'test/values'

describe('CoinbasePaymentSection', () => {
  let props: CoinbasePaymentSectionProps
  let mockStore: MockStoreEnhanced
  beforeEach(() => {
    props = {
      coinbaseProvider: mockProviders.find(
        (quote) => quote.paymentMethods[0] === PaymentMethod.Coinbase
      )!,
      setNoPaymentMethods: jest.fn(),
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
    expect(props.setNoPaymentMethods).toHaveBeenCalled()
  })
  it('shows nothing if coinbase is not restricted but feature flag is false', async () => {
    props.coinbaseProvider!.restricted = false
    const { queryByText } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    expect(queryByText('Coinbase Pay')).toBeFalsy()
    expect(props.setNoPaymentMethods).toHaveBeenCalled()
  })
  it('shows nothign if coinbase is restricted and feature flag is true', async () => {
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
    expect(props.setNoPaymentMethods).toHaveBeenCalled()
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
    expect(props.setNoPaymentMethods).not.toHaveBeenCalled()
  })
})
