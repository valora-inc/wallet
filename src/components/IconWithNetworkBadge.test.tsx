import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import IconWithNetworkBadge from 'src/components/IconWithNetworkBadge'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId, mockTokenBalances } from 'test/values'

import { NetworkId } from 'src/transactions/types'

const MOCK_TOKEN_BALANCES = {
  [mockCeloTokenId]: {
    ...mockTokenBalances[mockCeloTokenId],
    networkIconUrl:
      'https://raw.githubusercontent.com/address-metadata/main/assets/tokens/CELO.png',
  },
}

describe('IconWithNetworkBadge', () => {
  it('renders correctly with overlay', () => {
    const store = createMockStore({
      tokens: {
        error: false,
        tokenBalances: MOCK_TOKEN_BALANCES,
      },
    })

    const { queryByTestId } = render(
      <Provider store={store}>
        <IconWithNetworkBadge networkId={NetworkId['celo-alfajores']} testID="Icon">
          <></>
        </IconWithNetworkBadge>
      </Provider>
    )
    expect(queryByTestId('Icon/NetworkBadge')).toBeTruthy()
  })

  it('renders correctly without overlay', () => {
    const store = createMockStore({})

    const { queryByTestId } = render(
      <Provider store={store}>
        <IconWithNetworkBadge networkId={NetworkId['celo-alfajores']} testID="Icon">
          <></>
        </IconWithNetworkBadge>
      </Provider>
    )
    expect(queryByTestId('Position/NetworkIcon')).toBeFalsy()
  })
})
