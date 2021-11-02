import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import TokenBalancesScreen from 'src/tokens/TokenBalances'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockTokenBalances } from 'test/values'

const defaultStore = {
  tokens: {
    tokenBalances: mockTokenBalances,
  },
}

const mockScreenProps = getMockStackScreenProps(Screens.TokenBalances)

describe('HomeTokenBalance', () => {
  it('renders correctly with multiple balances', async () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          '0x00400FcbF0816bebB94654259de7273f4A05c762': {
            usdPrice: '0.1',
            address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
            symbol: 'POOF',
            imageUrl:
              'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_POOF.png',
            name: 'Poof Governance Token',
            decimals: 18,
            balance: '5',
          },
          '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
            usdPrice: '1.16',
            address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            symbol: 'cEUR',
            imageUrl:
              'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
            name: 'Celo Euro',
            decimals: 18,
            balance: '7',
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with one balance', async () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no balance', async () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {},
      },
    })

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })
})
