import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import { getExperimentParams, getFeatureGate } from 'src/statsig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(),
  getFeatureGate: jest.fn().mockReturnValue(false),
}))

// TODO avoid rendering WalletHome as we're mostly interested in testing the menu here

describe('DrawerNavigator', () => {
  beforeEach(() => {
    jest.mocked(getExperimentParams).mockReturnValue({
      discoverCopyEnabled: false,
    })
  })

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
    expect(queryByTestId('DrawerItem/swapScreen.title')).toBeFalsy()
    expect(queryByTestId('DrawerItem/dappsScreen.title')).toBeTruthy()
    expect(queryByTestId('DrawerItem/celoGold')).toBeTruthy()
    expect(queryByTestId('DrawerItem/addAndWithdraw')).toBeFalsy()
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

  it('shows recovery phrase if backup is not complete and cloud backup feature gate is false', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const store = createMockStore({
      account: {
        backupCompleted: false,
        cloudBackupCompleted: false,
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={DrawerNavigator}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('DrawerItem/accountKey')).toBeTruthy()
    expect(queryByTestId('DrawerItem/walletSecurity')).toBeNull()
  })

  it('shows wallet security if backup is not complete and cloud backup feature gate is true', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore({
      account: {
        backupCompleted: false,
        cloudBackupCompleted: false,
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={DrawerNavigator}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('DrawerItem/accountKey')).toBeNull()
    expect(queryByTestId('DrawerItem/walletSecurity')).toBeTruthy()
  })

  it.each([
    [true, false],
    [false, true],
    [true, true],
  ])(
    'hides wallet security and recovery phrase if at least one backup is complete',
    (backupCompleted, cloudBackupCompleted) => {
      const store = createMockStore({
        account: {
          backupCompleted,
          cloudBackupCompleted,
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DrawerNavigator}></MockedNavigator>
        </Provider>
      )
      expect(queryByTestId('DrawerItem/accountKey')).toBeNull()
      expect(queryByTestId('DrawerItem/walletSecurity')).toBeNull()
    }
  )

  describe('phone number in drawer', () => {
    it('shows the phone number when the user is verified', () => {
      const store = createMockStore({
        app: {
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

    it('hides the phone number when the user is verified decentrally', () => {
      const store = createMockStore({
        app: {
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
