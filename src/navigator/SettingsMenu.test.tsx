import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import SettingsMenu from 'src/navigator/SettingsMenu'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn().mockReturnValue(false),
  getMultichainFeatures: jest.fn(() => ({
    showBalances: ['celo-alfajores'],
  })),
}))

describe('SettingsMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the expected menu items', () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SettingsMenu}></MockedNavigator>
      </Provider>
    )
    expect(getByTestId('SettingsMenu/Profile/Username')).toBeTruthy()
    expect(getByTestId('SettingsMenu/Address')).toBeTruthy()
    expect(getByTestId('SettingsMenu/Invite')).toBeTruthy()
    expect(getByTestId('SettingsMenu/Preferences')).toBeTruthy()
    expect(getByTestId('SettingsMenu/Security')).toBeTruthy()
    expect(getByTestId('SettingsMenu/ConnectedDapps')).toBeTruthy()
    expect(getByTestId('SettingsMenu/Help')).toBeTruthy()
    expect(getByTestId('SettingsMenu/Legal')).toBeTruthy()
    expect(getByTestId('SettingsMenu/Version')).toBeTruthy()
  })
  it('does not show username if not set', () => {
    const store = createMockStore({
      account: {
        name: '',
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SettingsMenu}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('SettingsMenu/Username')).toBeFalsy()
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
          <MockedNavigator component={SettingsMenu}></MockedNavigator>
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
          <MockedNavigator component={SettingsMenu}></MockedNavigator>
        </Provider>
      )
      expect(queryByText('+1 302-306-1234')).toBeFalsy()
    })
  })

  it('menu items navigate to appropriate screens', () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SettingsMenu}></MockedNavigator>
      </Provider>
    )

    fireEvent.press(getByTestId('SettingsMenu/Profile'))
    fireEvent.press(getByTestId('SettingsMenu/Address'))
    fireEvent.press(getByTestId('SettingsMenu/Invite'))
    fireEvent.press(getByTestId('SettingsMenu/Help'))
    fireEvent.press(getByTestId('SettingsMenu/Legal'))
    fireEvent.press(getByTestId('SettingsMenu/ConnectedDapps'))

    expect(navigate).toHaveBeenCalledTimes(6)

    expect(navigate).toHaveBeenNthCalledWith(1, Screens.ProfileSubmenu)
    expect(navigate).toHaveBeenNthCalledWith(2, Screens.QRNavigator, {
      screen: Screens.QRCode,
      params: { showSecureSendStyling: true },
    })
    expect(navigate).toHaveBeenNthCalledWith(3, Screens.Invite)
    expect(navigate).toHaveBeenNthCalledWith(4, Screens.Support)
    expect(navigate).toHaveBeenNthCalledWith(5, Screens.LegalSubmenu)
    expect(navigate).toHaveBeenNthCalledWith(6, Screens.WalletConnectSessions)
  })
})
