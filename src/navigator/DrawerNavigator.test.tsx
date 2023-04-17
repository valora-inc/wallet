import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import { getExperimentParams } from 'src/statsig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn().mockReturnValue({
    showAddWithdrawOnMenu: true,
    showSwapOnMenu: true,
  }),
}))

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

  it('hides add/withdraw menu item based on statsig experiment param', () => {
    ;(getExperimentParams as jest.Mock).mockReturnValueOnce({
      showAddWithdrawOnMenu: false,
    })
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator component={DrawerNavigator}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('DrawerItem/addAndWithdraw')).toBeNull()
  })

  it('hides swap menu item based on statsig experiment param', () => {
    ;(getExperimentParams as jest.Mock).mockReturnValueOnce({
      showSwapOnMenu: false,
    })
    const store = createMockStore({
      app: {
        showSwapMenuInDrawerMenu: true,
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={DrawerNavigator}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('DrawerItem/swapScreen.title')).toBeNull()
  })

  describe('phone number in drawer', () => {
    it('shows the phone number when the user is verified', () => {
      const store = createMockStore({
        app: {
          requireCPV: true,
          numberVerified: false,
          phoneNumberVerified: true,
        },
        account: {
          e164PhoneNumber: '+13023061234',
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DrawerNavigator}></MockedNavigator>
        </Provider>
      )

      expect(getByText('+1 302-306-1234')).toBeTruthy()
    })

    it("shows the phone number when the user is verified decentrally and we don't require CPV", () => {
      const store = createMockStore({
        app: {
          requireCPV: false,
          numberVerified: true,
          phoneNumberVerified: false,
        },
        account: {
          e164PhoneNumber: '+13023061234',
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DrawerNavigator}></MockedNavigator>
        </Provider>
      )

      expect(getByText('+1 302-306-1234')).toBeTruthy()
    })

    it('hides the phone number when the user is verified decentrally and we require CPV', () => {
      const store = createMockStore({
        app: {
          requireCPV: true,
          numberVerified: true,
          phoneNumberVerified: false,
        },
        account: {
          e164PhoneNumber: '+13023061234',
        },
      })
      const { queryByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DrawerNavigator}></MockedNavigator>
        </Provider>
      )

      expect(queryByText('+1 302-306-1234')).toBeFalsy()
    })

    it('shows no phone number when the user is not verified', () => {
      const store = createMockStore({
        app: {
          requireCPV: true,
          numberVerified: false,
          phoneNumberVerified: false,
        },
        account: {
          e164PhoneNumber: '+13023061234',
        },
      })
      const { queryByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DrawerNavigator}></MockedNavigator>
        </Provider>
      )

      expect(queryByText('+1 302-306-1234')).toBeFalsy()
    })
  })
})
