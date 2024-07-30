import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { PositionIcon } from 'src/tokens/PositionIcon'
import { Position } from 'src/positions/types'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId, mockTokenBalances } from 'test/values'

const MOCK_TOKEN_BALANCES = {
  [mockCeloTokenId]: {
    ...mockTokenBalances[mockCeloTokenId],
    networkIconUrl:
      'https://raw.githubusercontent.com/address-metadata/main/assets/tokens/CELO.png',
  },
}

const MOCK_POSITION = {
  displayProps: {
    imageUrl: 'http://foo.com',
  },
  networkId: 'celo-alfajores',
} as unknown as Position

describe('TokenIcon', () => {
  it('renders correctly with overlay', () => {
    const store = createMockStore({
      tokens: {
        error: false,
        loading: false,
        tokenBalances: MOCK_TOKEN_BALANCES,
      },
    })

    const { queryByTestId } = render(
      <Provider store={store}>
        <PositionIcon testID="Position" position={MOCK_POSITION} />
      </Provider>
    )
    expect(queryByTestId('Position/NetworkIcon')).toBeTruthy()
  })

  it('renders correctly without overlay', () => {
    const store = createMockStore({})

    const { queryByTestId } = render(
      <Provider store={store}>
        <PositionIcon testID="Position" position={MOCK_POSITION} />
      </Provider>
    )
    expect(queryByTestId('Position/NetworkIcon')).toBeFalsy()
  })
})
