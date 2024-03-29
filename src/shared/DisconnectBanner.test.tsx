import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { createMockStore, createMockStoreAppDisconnected } from 'test/utils'

it('renders banner when app is disconnected', () => {
  const store = createMockStoreAppDisconnected()
  const tree = render(
    <Provider store={store}>
      <DisconnectBanner />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders nothing when connected', () => {
  const store = createMockStore()
  const tree = render(
    <Provider store={store}>
      <DisconnectBanner />
    </Provider>
  )
  expect(tree.toJSON()).toBeNull()
})
