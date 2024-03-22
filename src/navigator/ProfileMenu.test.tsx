import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import ProfileMenu from 'src/navigator/ProfileMenu'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn().mockReturnValue(false),
  getDynamicConfigParams: jest.fn(() => ({
    showBalances: ['celo-alfajores'],
  })),
}))

describe('ProfileMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the expected menu items', () => {
    const store = createMockStore()
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={ProfileMenu}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('ProfileMenu/Username')).toBeTruthy()
    expect(queryByTestId('ProfileMenu/Invite')).toBeTruthy()
    expect(queryByTestId('ProfileMenu/Settings')).toBeTruthy()
    expect(queryByTestId('ProfileMenu/Help')).toBeTruthy()
    expect(queryByTestId('AccountNumber')).toBeTruthy()
    expect(queryByTestId('ProfileMenu/SupportedNetworks')).toBeTruthy()
    expect(queryByTestId('ProfileMenu/Version')).toBeTruthy()
  })
  it('does not show username if not set', () => {
    const store = createMockStore({
      account: {
        name: '',
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={ProfileMenu}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('ProfileMenu/Username')).toBeFalsy()
  })
  describe('shows phone number correctly', () => {
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
          <MockedNavigator component={ProfileMenu}></MockedNavigator>
        </Provider>
      )
      expect(getByText('+1 302-306-1234')).toBeTruthy()
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
          <MockedNavigator component={ProfileMenu}></MockedNavigator>
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
          <MockedNavigator component={ProfileMenu}></MockedNavigator>
        </Provider>
      )

      expect(getByText(expectedText)).toBeTruthy()
    })
  })
  it('menu items navigate to appropriate screens', () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={ProfileMenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(getByTestId('ProfileMenu/Invite'))
    fireEvent.press(getByTestId('ProfileMenu/Settings'))
    fireEvent.press(getByTestId('ProfileMenu/Help'))
    expect(navigate).toHaveBeenCalledTimes(3)
    expect(navigate).toHaveBeenNthCalledWith(1, Screens.Invite)
    expect(navigate).toHaveBeenNthCalledWith(2, Screens.Settings)
    expect(navigate).toHaveBeenNthCalledWith(3, Screens.Support)
  })
})
