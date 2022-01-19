import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { createMockStore } from 'test/utils'
import { mockTestTokenAddress } from 'test/values'
import SendOrRequestBar from './SendOrRequestBar'

describe('SendOrRequestBar', () => {
  it('enables buttons when there are sendable tokens', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockTestTokenAddress]: {
            address: mockTestTokenAddress,
            symbol: 'TT',
            balance: '10',
          },
        },
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <SendOrRequestBar />
      </Provider>
    )
    expect(getByTestId('SendOrRequestBar/SendButton')).not.toBeDisabled()
    expect(getByTestId('SendOrRequestBar/RequestButton')).not.toBeDisabled()
  })

  it('send button disabled and request button enabled when there are no tokens', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockTestTokenAddress]: {
            address: mockTestTokenAddress,
            symbol: 'cUSD',
            balance: '0',
          },
        },
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <SendOrRequestBar />
      </Provider>
    )
    expect(getByTestId('SendOrRequestBar/SendButton')).toBeDisabled()
    expect(getByTestId('SendOrRequestBar/RequestButton')).not.toBeDisabled()
  })
})
