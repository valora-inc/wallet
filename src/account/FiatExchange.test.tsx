import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import FiatExchange, { FiatExchangeSection } from 'src/account/FiatExchange'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import { createMockStore } from 'test/utils'

describe('FiatExchange', () => {
  it('renders correctly', () => {
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const tree = render(
      <Provider store={store}>
        <FiatExchange />
      </Provider>
    )
    expect(store.dispatch).toHaveBeenCalledWith(fetchFiatConnectProviders())
    expect(tree.queryByTestId('FiatExchange/DrawerBar')).toBeTruthy()
    expect(tree.queryByTestId('FiatExchangeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('addFunds')).toBeTruthy()
    expect(tree.queryByTestId('cashOut')).toBeTruthy()
  })
  it('hides add funds section and top nav', () => {
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const tree = render(
      <Provider store={store}>
        <FiatExchangeSection showAddFunds={false} showDrawerTopNav={false} />
      </Provider>
    )
    expect(store.dispatch).toHaveBeenCalledWith(fetchFiatConnectProviders())
    expect(tree.queryByTestId('FiatExchange/DrawerBar')).toBeFalsy()
    expect(tree.queryByTestId('FiatExchangeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('addFunds')).toBeFalsy()
    expect(tree.queryByTestId('cashOut')).toBeTruthy()
  })
})
