import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import TokenIcon from 'src/components/TokenIcon'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId, mockCusdTokenId, mockPoofTokenId, mockTokenBalances } from 'test/values'

// Setting up the mock token balances with expected additional values
const CELO_TOKEN = {
  ...mockTokenBalances[mockCeloTokenId],
  imageUrl: 'https://example.com/address-metadata/main/assets/tokens/CELO.png',
}
const CUSD_TOKEN = {
  ...mockTokenBalances[mockCusdTokenId],
  imageUrl: 'https://example.com/address-metadata/main/assets/tokens/CELO.png',
  networkIconUrl: 'https://example.com/address-metadata/main/assets/tokens/CELO.png',
}
const NO_IMAGE_TOKEN = {
  ...mockTokenBalances[mockPoofTokenId],
  imageUrl: undefined,
  networkIconUrl: 'https://example.com/address-metadata/main/assets/tokens/CELO.png',
}

const store = createMockStore({
  tokens: {
    error: false,
    tokenBalances: mockTokenBalances,
  },
})

describe('TokenIcon', () => {
  it('renders correctly with a native token', () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <TokenIcon testID="Assets" token={CELO_TOKEN} />
      </Provider>
    )
    expect(getByTestId('Assets/TokenIcon')).toHaveProp('source', {
      uri: CELO_TOKEN.imageUrl,
    })
    expect(queryByTestId('Assets/NetworkIcon')).toBeFalsy()
  })

  it('renders correctly with a non-native token', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenIcon token={CUSD_TOKEN} />
      </Provider>
    )
    expect(getByTestId('TokenIcon')).toHaveProp('source', {
      uri: CUSD_TOKEN.imageUrl,
    })
    expect(getByTestId('NetworkIcon')).toHaveProp('source', {
      uri: CELO_TOKEN.imageUrl,
    })
  })

  it('renders correctly with default icon if no token icon is present', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenIcon token={NO_IMAGE_TOKEN} />
      </Provider>
    )
    expect(getByTestId('DefaultTokenIcon')).toBeTruthy()
    expect(getByTestId('NetworkIcon')).toHaveProp('source', {
      uri: CELO_TOKEN.imageUrl,
    })
  })
})
