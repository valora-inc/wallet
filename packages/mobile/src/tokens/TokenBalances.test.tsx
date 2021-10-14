import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import TokenBalancesScreen from 'src/tokens/TokenBalances'
import { createMockStore } from 'test/utils'
import { mockTokenBalances } from 'test/values'

const defaultStore = {
  tokens: {
    tokenBalances: mockTokenBalances,
  },
}

describe('TokenBalancesScreen', () => {
  it('renders correctly with invite rewards disabled', async () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(tree.queryByTestId('InviteRewardsBanner')).toBeFalsy()
  })
})
