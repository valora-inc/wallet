import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import SecuritySubmenu from 'src/account/SecuritySubmenu'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { fireEvent, render, waitFor, act } from '@testing-library/react-native'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { FetchMock } from 'jest-fetch-mock/types'
import * as Keychain from 'react-native-keychain'
import { setAnalyticsEnabled } from 'src/app/actions'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { setPincodeSuccess } from 'src/account/actions'
import { mockE164Number } from 'test/values'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { PincodeType } from 'src/account/reducer'
import { removeStoredPin, setPincodeWithBiometry } from 'src/pincode/authentication'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { getFeatureGate } from 'src/statsig/index'
import { deleteKeylessBackupStarted, hideDeleteKeylessBackupError } from 'src/keylessBackup/slice'
import { KeylessBackupDeleteStatus } from 'src/keylessBackup/types'
import networkConfig from 'src/web3/networkConfig'

const mockedEnsurePincode = jest.mocked(ensurePincode)
const mockFetch = fetch as FetchMock
const mockedKeychain = jest.mocked(Keychain)
mockedKeychain.getGenericPassword.mockResolvedValue({
  username: 'some username',
  password: 'someSignedMessage',
  service: 'some service',
  storage: 'some string',
})

jest.mock('src/analytics/AppAnalytics')
jest.mock('src/statsig')

describe('SecuritySubmenu', () => {
  beforeEach(() => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    jest.clearAllMocks()
  })

  it('shows the expected menu items', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    expect(getByText('accountKey')).toBeTruthy() // recovery phrase
    expect(getByText('changePin')).toBeTruthy()
    expect(getByText('requirePinOnAppOpen')).toBeTruthy()
    expect(getByText('shareAnalytics')).toBeTruthy()
    expect(getByText('removeAccountTitle')).toBeTruthy()
    expect(getByText('deleteAccountTitle')).toBeTruthy()
  })

  it('triggers the correct actions on change data preferences', () => {
    const store = createMockStore({})
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )

    store.clearActions()
    fireEvent(getByText('shareAnalytics'), 'valueChange', false)

    expect(store.getActions()).toEqual([setAnalyticsEnabled(false)])
  })

  it('navigates to PincodeSet screen if entered PIN is correct', async () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    await act(() => {
      fireEvent.press(getByText('changePin'))
    })

    expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet, {
      changePin: true,
    })
  })

  it('does not navigate to PincodeSet screen if entered PIN is incorrect', async () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(false))
    await act(() => {
      fireEvent.press(getByText('changePin'))
    })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('toggle the biometry option correctly', async () => {
    const store = createMockStore({
      app: {
        supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
      },
      account: {
        pincodeType: PincodeType.CustomPin,
      },
    })
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )

    await act(() => {
      fireEvent(getByTestId('useBiometryToggle'), 'valueChange', true)
    })

    expect(getByText('useBiometryType, {"biometryType":"biometryType.FaceID"}')).toBeTruthy()
    expect(setPincodeWithBiometry).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual(
      expect.arrayContaining([setPincodeSuccess(PincodeType.PhoneAuth)])
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_biometry_opt_in_enable)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      SettingsEvents.settings_biometry_opt_in_complete
    )

    await act(() => {
      fireEvent(getByTestId('useBiometryToggle'), 'valueChange', false)
    })

    expect(removeStoredPin).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual(
      expect.arrayContaining([setPincodeSuccess(PincodeType.CustomPin)])
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_biometry_opt_in_disable)
  })

  it('navigates to recovery phrase if entered PIN is correct', async () => {
    const store = createMockStore()

    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    await act(() => {
      fireEvent.press(getByText('accountKey'))
    })

    expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_recovery_phrase)
    expect(navigate).toHaveBeenCalledWith(Screens.BackupIntroduction)
  })

  it('does not navigate to recovery phrase if entered PIN is incorrect', async () => {
    const store = createMockStore()

    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(false))
    await act(() => {
      fireEvent.press(getByText('accountKey'))
    })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('does not show keyless backup', () => {
    const store = createMockStore()
    const { queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    expect(queryByText('keylessBackSettingsTitle')).toBeNull()
  })

  it('shows keyless backup setup when flag is enabled and not already backed up', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    const store = createMockStore({ account: { cloudBackupCompleted: false } })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    expect(getByText('keylessBackupSettingsTitle')).toBeTruthy()
    expect(getByText('setup')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByText('keylessBackupSettingsTitle'))
    })
    expect(navigate).toHaveBeenCalledWith(Screens.WalletSecurityPrimer)
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenLastCalledWith(
      SettingsEvents.settings_set_up_keyless_backup
    )
  })

  it('shows keyless backup delete when flag is enabled and already backed up', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore({ account: { cloudBackupCompleted: true } })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    expect(getByText('keylessBackupSettingsTitle')).toBeTruthy()
    expect(getByText('delete')).toBeTruthy()
    fireEvent.press(getByText('keylessBackupSettingsTitle'))
    expect(navigate).not.toHaveBeenCalled()
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenLastCalledWith(
      SettingsEvents.settings_delete_keyless_backup
    )
    expect(store.getActions()).toContainEqual(deleteKeylessBackupStarted())
  })

  it('shows keyless backup in progress when flag is enabled and backup is in progress', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore({
      account: { cloudBackupCompleted: true },
      keylessBackup: { deleteBackupStatus: KeylessBackupDeleteStatus.InProgress },
    })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    expect(getByText('keylessBackupSettingsTitle')).toBeTruthy()
    expect(getByText('pleaseWait')).toBeTruthy()
    fireEvent.press(getByText('keylessBackupSettingsTitle'))
    expect(navigate).not.toHaveBeenCalled()
    expect(AppAnalytics.track).not.toHaveBeenCalled()
  })

  it('shows error banner when keyless backup delete fails', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore({
      account: { cloudBackupCompleted: true },
      keylessBackup: { showDeleteBackupError: true },
    })
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )
    expect(getByText('keylessBackupSettingsDeleteError')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('KeylessBackupDeleteError/dismiss'))
    })

    expect(store.getActions()).toContainEqual(hideDeleteKeylessBackupError())
  })

  it('fails the delete account request if phone number revoke fails', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ message: 'something went wrong' }), {
      status: 500,
    })
    const store = createMockStore({
      app: { phoneNumberVerified: true },
      account: {
        e164PhoneNumber: mockE164Number,
      },
    })

    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SecuritySubmenu}></MockedNavigator>
      </Provider>
    )

    // ignore dispatched actions on initial render
    store.clearActions()

    fireEvent.press(getByText('deleteAccountTitle'))
    fireEvent.press(getByText('deleteAccountWarning.buttonLabel'))

    await waitFor(() =>
      expect(getByText('deleteAccountWarning.buttonLabelRevokingPhoneNumber')).toBeTruthy()
    )

    expect(mockFetch).toHaveBeenNthCalledWith(1, `${networkConfig.revokePhoneNumberUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `${networkConfig.authHeaderIssuer} 0x0000000000000000000000000000000000007e57:someSignedMessage`,
      },
      body: '{"phoneNumber":"+14155550000","clientPlatform":"android","clientVersion":"0.0.1"}',
    })
    expect(store.getActions()).toEqual([
      showError('revokePhoneNumber.revokeError' as ErrorMessages),
    ])
    expect(navigate).not.toHaveBeenCalled()
  })
})
