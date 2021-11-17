import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import TokenBalancesScreen from 'src/tokens/TokenBalances'
import { amountFromComponent, createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockTokenBalances } from 'test/values'

const defaultStore = {
  tokens: {
    tokenBalances: mockTokenBalances,
  },
}

const mockScreenProps = getMockStackScreenProps(Screens.TokenBalances)

describe('TokenBalancesScreen', () => {
  it('renders correctly with invite rewards disabled', async () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(amountFromComponent(tree.getByTestId('tokenBalance:POOF'))).toBe('5.00')
    expect(amountFromComponent(tree.getByTestId('tokenLocalBalance:POOF'))).toBe('$0.67')
  })
})
