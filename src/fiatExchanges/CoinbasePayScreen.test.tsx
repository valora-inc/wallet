import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { CoinbasePayEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import CoinbasePayScreen from 'src/fiatExchanges/CoinbasePayScreen'
import { waitFor } from 'src/redux/sagas-helpers'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

const MOCK_COINBASE_PAY_URI = 'https://www.google.com'

jest.mock('src/analytics/AppAnalytics')

describe('CoinbasePayScreen', () => {
  it('check for analytics event', async () => {
    const { getByText } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator
          component={CoinbasePayScreen}
          params={{
            uri: MOCK_COINBASE_PAY_URI,
          }}
        />
      </Provider>
    )
    fireEvent.press(getByText('close'))
    await waitFor(() => {
      expect(AppAnalytics.track).toBeCalledWith(CoinbasePayEvents.coinbase_pay_flow_exit)
    })
  })
})
