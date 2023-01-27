import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

// TODO avoid rendering WalletHome as we're mostly interested in testing the menu here

describe('DrawerNavigator', () => {
  it('shows the expected menu items', () => {
    const store = createMockStore({
      app: {
        showSwapMenuInDrawerMenu: true,
      },
      dapps: {
        dappListApiUrl: 'http://example.com',
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={DrawerNavigator}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('Drawer/Header')).toBeTruthy()
    expect(queryByTestId('Drawer/Username')).toBeTruthy()

    expect(queryByTestId('DrawerItem/home')).toBeTruthy()
    expect(queryByTestId('DrawerItem/swapScreen.title')).toBeTruthy()
    expect(queryByTestId('DrawerItem/dappsScreen.title')).toBeTruthy()
    expect(queryByTestId('DrawerItem/celoGold')).toBeTruthy()
    expect(queryByTestId('DrawerItem/addAndWithdraw')).toBeTruthy()
    expect(queryByTestId('DrawerItem/invite')).toBeTruthy()
    expect(queryByTestId('DrawerItem/settings')).toBeTruthy()
    expect(queryByTestId('DrawerItem/help')).toBeTruthy()
  })

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

  it('hides the dapps menu item when dappListApiUrl is empty', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: '',
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={DrawerNavigator}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('DrawerItem/dappsScreen.title')).toBeNull()
  })
})
