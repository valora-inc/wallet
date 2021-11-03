import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import HomeTokenBalance from 'src/home/HomeTokenBalance'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText } from 'test/utils'
import { mockTokenBalances } from 'test/values'

const defaultStore = {
  tokens: {
    tokenBalances: mockTokenBalances,
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.USD,
    fetchedCurrencyCode: LocalCurrencyCode.USD,
    exchangeRates: {
      [Currency.Dollar]: '1',
      [Currency.Euro]: null,
      [Currency.Celo]: null,
    },
  },
}

describe('HomeTokenBalance', () => {
  it('renders correctly with multiple balances', async () => {
    const store = createMockStore({
      ...defaultStore,
      tokens: {
        tokenBalances: {
          '0x00400FcbF0816bebB94654259de7273f4A05c762': {
            usdPrice: '0.1',
            address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
            symbol: 'POOF',
            balance: '5',
          },
          '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
            usdPrice: '1.16',
            address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            symbol: 'cEUR',
            balance: '7',
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$8.62')
  })

  it('renders correctly with one balance', async () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$0.50')
  })

  it('renders correctly with no balance', async () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {},
      },
    })

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$0.00')
  })
})
