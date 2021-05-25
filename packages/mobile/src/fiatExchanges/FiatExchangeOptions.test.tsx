import BigNumber from 'bignumber.js'
import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import FiatExchangeOptions from 'src/fiatExchanges/FiatExchangeOptions'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = (isCashIn: boolean) =>
  getMockStackScreenProps(Screens.FiatExchangeOptions, {
    isCashIn,
    amount: new BigNumber('1'),
  })

const mockStore = createMockStore({
  networkInfo: {
    userLocationData: {
      country: 'US',
      state: null,
      ipAddress: null,
    },
  },
})

jest.mock('src/fiatExchanges/utils', () => ({
  ...(jest.requireActual('src/fiatExchanges/utils') as any),
  fetchLocalCicoProviders: jest.fn(() => [
    {
      name: 'CryptoProvider',
      celo: {
        cashIn: true,
        cashOut: true,
        countries: ['US'],
        url: 'https://www.fakecryptoprovider.com/celo',
      },
      cusd: {
        cashIn: true,
        cashOut: true,
        countries: ['US'],
        url: 'https://www.fakecryptoprovider.com/celo',
      },
    },
  ]),
}))

describe('FiatExchangeOptions', () => {
  beforeEach(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = render(
      <Provider store={mockStore}>
        <FiatExchangeOptions {...mockScreenProps(true)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()

    tree.rerender(
      <Provider store={mockStore}>
        <FiatExchangeOptions {...mockScreenProps(true)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
