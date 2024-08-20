import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import ProfileMenu from 'src/account/ProfileMenu'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'
import { FetchMock } from 'jest-fetch-mock/types'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockE164Number } from 'test/values'
import networkConfig from 'src/web3/networkConfig'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import * as Keychain from 'react-native-keychain'
const mockFetch = fetch as FetchMock
const mockedKeychain = jest.mocked(Keychain)
import Logger from 'src/utils/Logger'

jest.mock('src/utils/Logger')

mockedKeychain.getGenericPassword.mockResolvedValue({
  username: 'some username',
  password: 'someSignedMessage',
  service: 'some service',
  storage: 'some string',
})
jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn().mockReturnValue(false),
  getMultichainFeatures: jest.fn(() => ({
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
    expect(queryByTestId('ProfileMenu/EditProfile')).toBeTruthy()
    expect(queryByTestId('ProfileMenu/Verify')).toBeTruthy()
  })
  it('can revoke the phone number successfully', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ message: 'OK' }), {
      status: 200,
    })
    const store = createMockStore({
      app: { phoneNumberVerified: true },
      account: {
        e164PhoneNumber: mockE164Number,
      },
    })

    const tree = render(
      <Provider store={store}>
        <ProfileMenu {...getMockStackScreenProps(Screens.ProfileMenu)} />
      </Provider>
    )

    fireEvent.press(tree.getByText('revokePhoneNumber.title'))

    expect(tree.getByText('revokePhoneNumber.bottomSheetTitle')).toBeTruthy()
    expect(tree.getByText('+1 415-555-0000')).toBeTruthy()

    await act(() => {
      fireEvent.press(tree.getByText('revokePhoneNumber.confirmButton'))
    })

    await waitFor(() => expect(tree.getByText('revokePhoneNumber.revokeSuccess')).toBeTruthy())
    expect(mockFetch).toHaveBeenNthCalledWith(1, `${networkConfig.revokePhoneNumberUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `${networkConfig.authHeaderIssuer} 0x0000000000000000000000000000000000007e57:someSignedMessage`,
      },
      body: '{"phoneNumber":"+14155550000","clientPlatform":"android","clientVersion":"0.0.1"}',
    })
  })

  it('shows the error on revoke phone number error', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ message: 'something went wrong' }), {
      status: 500,
    })
    const store = createMockStore({
      app: { phoneNumberVerified: true },
      account: {
        e164PhoneNumber: mockE164Number,
      },
    })

    const tree = render(
      <Provider store={store}>
        <ProfileMenu {...getMockStackScreenProps(Screens.ProfileMenu)} />
      </Provider>
    )

    fireEvent.press(tree.getByText('revokePhoneNumber.title'))
    await act(() => {
      fireEvent.press(tree.getByText('revokePhoneNumber.confirmButton'))
    })

    await waitFor(() =>
      expect(Logger.showError).toHaveBeenCalledWith('revokePhoneNumber.revokeError')
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
