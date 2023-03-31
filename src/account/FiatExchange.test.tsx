import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import FiatExchange from 'src/account/FiatExchange'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('FiatExchange', () => {
  it('renders correctly', () => {
    const mockProps = getMockStackScreenProps(Screens.FiatExchange)
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const tree = render(
      <Provider store={store}>
        <FiatExchange {...mockProps} />
      </Provider>
    )
    expect(store.dispatch).toHaveBeenCalledWith(fetchFiatConnectProviders())
    expect(tree.queryByTestId('FiatExchangeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('addFunds')).toBeTruthy()
    expect(tree.queryByTestId('cashOut')).toBeTruthy()
  })
  it('hides add funds section', () => {
    const mockProps = getMockStackScreenProps(Screens.FiatExchange, {
      hideAddFunds: true,
    })
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const tree = render(
      <Provider store={store}>
        <FiatExchange {...mockProps} />
      </Provider>
    )
    expect(store.dispatch).toHaveBeenCalledWith(fetchFiatConnectProviders())
    expect(tree.queryByTestId('FiatExchangeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('addFunds')).toBeFalsy()
    expect(tree.queryByTestId('cashOut')).toBeTruthy()
  })
})
