import { CommonActions } from '@react-navigation/native'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import { ensurePincode } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams, getExperimentParams, getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(),
  getFeatureGate: jest.fn().mockReturnValue(false),
  getDynamicConfigParams: jest.fn(() => ({
    showBalances: ['celo-alfajores'],
  })),
}))

// TODO avoid rendering WalletHome as we're mostly interested in testing the menu here

describe('DrawerNavigator', () => {
  beforeEach(() => {
    jest.mocked(getExperimentParams).mockReturnValue({
      discoverCopyEnabled: false,
    })
    jest.clearAllMocks()
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
    expect(queryByTestId('DrawerItem/dappsScreen.title')).toBeTruthy()
    expect(queryByTestId('DrawerItem/celoGold')).toBeTruthy()
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

  it.each([
    {
      featureGate: true,
      screen: Screens.WalletSecurityPrimerDrawer,
      title: 'walletSecurity',
    },
    {
      featureGate: false,
      screen: Screens.BackupIntroduction,
      title: 'accountKey',
    },
  ])(
    'navigates to protected route $screen after ensuring pin',
    async ({ featureGate, screen, title }) => {
      jest.mocked(getFeatureGate).mockReturnValue(featureGate)
      jest.mocked(ensurePincode).mockResolvedValueOnce(true)
      const store = createMockStore({
        account: {
          backupCompleted: false,
          cloudBackupCompleted: false,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DrawerNavigator}></MockedNavigator>
        </Provider>
      )
      await fireEvent.press(getByTestId(`DrawerItem/${title}`))
      expect(ensurePincode).toHaveBeenCalledWith()
      expect(CommonActions.navigate).toHaveBeenCalledWith(screen)
    }
  )

  it.each([
    {
      featureGate: true,
      screen: Screens.WalletSecurityPrimerDrawer,
      title: 'walletSecurity',
    },
    {
      featureGate: false,
      screen: Screens.BackupIntroduction,
      title: 'accountKey',
    },
  ])(
    'does not navigate to protected route $screen if pin is incorrect',
    async ({ featureGate, title }) => {
      jest.mocked(getFeatureGate).mockReturnValue(featureGate)
      jest.mocked(ensurePincode).mockResolvedValueOnce(false)
      const store = createMockStore({
        account: {
          backupCompleted: false,
          cloudBackupCompleted: false,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DrawerNavigator}></MockedNavigator>
        </Provider>
      )
      await fireEvent.press(getByTestId(`DrawerItem/${title}`))
      expect(ensurePincode).toHaveBeenCalledWith()
      expect(CommonActions.navigate).not.toHaveBeenCalled()
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

  describe('network display', () => {
    const testCases = [
      {
        testName: 'one network',
        showBalances: [NetworkId['celo-alfajores']],
        expectedText: 'supportedNetwork, {"network":"Celo Alfajores"}',
      },
      {
        testName: 'two networks',
        showBalances: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
        expectedText: 'supportedNetworks, {"networks":"Celo Alfajores and Ethereum Sepolia"}',
      },
      {
        testName: 'three networks',
        showBalances: [
          NetworkId['celo-mainnet'],
          NetworkId['ethereum-sepolia'],
          NetworkId['celo-alfajores'],
        ],
        expectedText: 'supportedNetworks, {"networks":"Celo, Ethereum Sepolia and Celo Alfajores"}',
      },
    ]

    it.each(testCases)('shows $testName correctly', ({ showBalances, expectedText }) => {
      jest.mocked(getDynamicConfigParams).mockReturnValue({
        showBalances,
      })

      const store = createMockStore({})
      const { getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DrawerNavigator}></MockedNavigator>
        </Provider>
      )

      expect(getByText(expectedText)).toBeTruthy()
    })
  })
})
