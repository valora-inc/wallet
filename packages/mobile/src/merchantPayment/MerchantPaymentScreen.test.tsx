import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import MerchantPaymentScreen from 'src/merchantPayment/MerchantPaymentScreen'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { makeExchangeRates } from 'test/values'

const mockScreenProps = getMockStackScreenProps(Screens.MerchantPayment, {
  apiBase: 'https://example.com',
  referenceId: '123',
})
const exchangeRates = makeExchangeRates('0.11', '10')

describe('MerchantPaymentScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore({
      goldToken: { balance: '2' },
      stableToken: { balances: { [Currency.Dollar]: '10' } },
      exchange: { exchangeRates },
    })

    const tree = render(
      <Provider store={store}>
        <MerchantPaymentScreen {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
