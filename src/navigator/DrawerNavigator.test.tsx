import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

// This avoids rendering WalletHome as we're mostly interested in testing the menu here
jest.mock('src/home/WalletHome')
describe('DrawerNavigator', () => {
  // TODO: need to add tests here now that the DrawerNavigator no longer displays balances
  it.todo('renders correctly')
  it('does not include username when username is empty', () => {
    const store = createMockStore({
      account: {
        name: '',
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={DrawerNavigator}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('Drawer/Header')).toBeTruthy()
    expect(queryByTestId('Drawer/Username')).toBeNull()
  })
})
