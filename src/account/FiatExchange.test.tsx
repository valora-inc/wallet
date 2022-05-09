import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import FiatExchange from 'src/account/FiatExchange'
import { createMockStore } from 'test/utils'

describe('FiatExchange', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <FiatExchange />
      </Provider>
    )
    expect(tree.queryByTestId('FiatExchangeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('addFunds')).toBeTruthy()
    expect(tree.queryByTestId('cashOut')).toBeTruthy()
  })
})
