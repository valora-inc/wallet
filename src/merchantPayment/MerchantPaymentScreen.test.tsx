import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import MerchantPaymentScreen from 'src/merchantPayment/MerchantPaymentScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { makeExchangeRates, mockCeloAddress, mockCusdAddress } from 'test/values'

const mockScreenProps = getMockStackScreenProps(Screens.MerchantPayment, {
  apiBase: 'https://example.com',
  referenceId: '123',
})
const exchangeRates = makeExchangeRates('0.11', '10')

describe('MerchantPaymentScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCeloAddress]: {
            address: mockCeloAddress,
            symbol: 'CELO',
            usdPrice: '.6',
            balance: '2',
            priceFetchedAt: Date.now(),
          },
          [mockCusdAddress]: {
            address: mockCusdAddress,
            symbol: 'cUSD',
            usdPrice: '1',
            balance: '10',
            priceFetchedAt: Date.now(),
          },
        },
      },
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
