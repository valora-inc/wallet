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
import { navigate } from 'src/navigator/NavigationService'
import { createMockStore } from 'test/utils'
import { mockProviders } from 'test/values'
import { mocked } from 'ts-jest/utils'

const FAKE_APP_ID = 'fake app id'
const FAKE_URL = 'www.coinbasepay.test'

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('@coinbase/cbpay-js', () => ({
  generateOnRampURL: jest.fn(),
}))

describe('CoinbasePaymentSection', () => {
  let props: CoinbasePaymentSectionProps
  let mockStore: MockStoreEnhanced
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    props = {
      cryptoAmount: 10,
      coinbaseProvider: mockProviders.find((quote) =>
        quote.paymentMethods.includes(PaymentMethod.Coinbase)
      )!,
      appId: FAKE_APP_ID,
    }
    mockStore = createMockStore()
  })

  it('navigates to coinbase flow when card is pressed', async () => {
    mocked(generateOnRampURL).mockReturnValue(FAKE_URL)
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
