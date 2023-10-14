import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import TokenDetailsMoreActions from 'src/tokens/TokenDetailsMoreActions'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn(() => {
    return {
      showCico: ['celo-alfajores'],
      showSend: ['celo-alfajores'],
      showSwap: ['celo-alfajores'],
    }
  }),
}))

const mockCeloBalance = mockTokenBalances[mockCeloTokenId]
mockCeloBalance.balance = '100'

describe('TokenDetails', () => {
  it('renders title, balance and token balance item', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCeloTokenId]: mockCeloBalance,
        },
      },
    })

    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator
          component={TokenDetailsMoreActions}
          params={{ tokenId: mockCeloTokenId }}
        />
      </Provider>
    )

    expect(getByText('tokenDetails.actions.send')).toBeTruthy()
    // TODO: figure out why swaps are not showing up in tests
    // expect(getByText('tokenDetails.actions.swap')).toBeTruthy()
    expect(getByText('tokenDetails.actions.add')).toBeTruthy()
    expect(getByText('tokenDetails.actions.withdraw')).toBeTruthy()
  })
})
