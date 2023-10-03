import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import MerchantPaymentScreen from 'src/merchantPayment/MerchantPaymentScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  makeExchangeRates,
  mockCeloAddress,
  mockCeloTokenId,
  mockCusdAddress,
  mockCusdTokenId,
} from 'test/values'
import { NetworkId } from 'src/transactions/types'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

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
          [mockCeloTokenId]: {
            address: mockCeloAddress,
            tokenId: mockCeloTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'CELO',
            priceUsd: '.6',
            balance: '2',
            priceFetchedAt: Date.now(),
          },
          [mockCusdTokenId]: {
            address: mockCusdAddress,
            tokenId: mockCusdTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cUSD',
            priceUsd: '1',
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
