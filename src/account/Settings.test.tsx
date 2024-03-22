import * as Sentry from '@sentry/react-native'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import * as Keychain from 'react-native-keychain'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { Provider } from 'react-redux'
import { clearStoredAccount, setPincodeSuccess, toggleBackupState } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import Settings from 'src/account/Settings'
import { showError } from 'src/alert/actions'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  hapticFeedbackSet,
  resetAppOpenedState,
  setAnalyticsEnabled,
  setNumberVerified,
} from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { PRIVACY_LINK, TOS_LINK } from 'src/brandingConfig'
import { deleteKeylessBackupStarted, hideDeleteKeylessBackupError } from 'src/keylessBackup/slice'
import { KeylessBackupDeleteStatus } from 'src/keylessBackup/types'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { removeStoredPin, setPincodeWithBiometry } from 'src/pincode/authentication'
import { getFeatureGate } from 'src/statsig/index'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockE164Number, mockE164NumberPepper, mockTokenBalances } from 'test/values'

const mockedEnsurePincode = jest.mocked(ensurePincode)
const mockFetch = fetch as FetchMock
const mockedKeychain = jest.mocked(Keychain)
mockedKeychain.getGenericPassword.mockResolvedValue({
  username: 'some username',
  password: 'someSignedMessage',
  service: 'some service',
  storage: 'some string',
})

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/utils/Logger')
jest.mock('src/statsig')

describe('Account', () => {
  beforeEach(() => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    jest.clearAllMocks()
  })

  it('renders the correct settings items', () => {
    const { getByText, getByTestId } = render(
      <Provider
        store={createMockStore({
          account: {
            e164PhoneNumber: mockE164Number,
          },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          tokens: mockTokenBalances,
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    expect(getByText('settings')).toBeTruthy()
    expect(getByTestId('EditProfile')).toBeTruthy()
    expect(getByText('confirmNumber')).toBeTruthy()

    expect(getByText('languageSettings')).toBeTruthy()
    expect(getByTestId('ChangeLanguage')).toHaveTextContent('Español')

    expect(getByText('localCurrencySetting')).toBeTruthy()
    expect(getByTestId('ChangeCurrency')).toHaveTextContent('PHP')

    expect(getByText('connectedApplications')).toBeTruthy()
    expect(getByTestId('ConnectedApplications')).toHaveTextContent('0')

    expect(getByText('accountKey')).toBeTruthy() // recovery phrase
    expect(getByText('changePin')).toBeTruthy()
    expect(getByText('requirePinOnAppOpen')).toBeTruthy()
    expect(getByText('hapticFeedback')).toBeTruthy()
    expect(getByText('shareAnalytics')).toBeTruthy()

    expect(getByText('licenses')).toBeTruthy()
    expect(getByText('termsOfServiceLink')).toBeTruthy()
    expect(getByText('privacyPolicy')).toBeTruthy()

    expect(getByText('deleteAccountTitle')).toBeTruthy()
  })

  it('triggers the correct actions on change app preferences', () => {
    const store = createMockStore({})
    const { getByText } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    store.clearActions()
    fireEvent(getByText('hapticFeedback'), 'valueChange', true)

    expect(store.getActions()).toEqual([hapticFeedbackSet(true)])
  })

  it('triggers the correct actions on change data preferences', () => {
    const store = createMockStore({})
    const { getByText } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    store.clearActions()
    fireEvent(getByText('shareAnalytics'), 'valueChange', false)

    expect(store.getActions()).toEqual([setAnalyticsEnabled(false)])
  })

  it('triggers the correct actions on press legal items', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    fireEvent.press(getByText('licenses'))
    fireEvent.press(getByText('termsOfServiceLink'))
    fireEvent.press(getByText('privacyPolicy'))

    expect(navigate).toHaveBeenNthCalledWith(1, Screens.Licenses)
    expect(navigateToURI).toHaveBeenNthCalledWith(1, TOS_LINK)
    expect(navigateToURI).toHaveBeenNthCalledWith(2, PRIVACY_LINK)
  })

  it('renders the dev mode menu', () => {
    const mockAddress = '0x0000000000000000000000000000000000007e57'
    const store = createMockStore({
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      tokens: mockTokenBalances,
      account: {
        devModeActive: true,
        e164PhoneNumber: mockE164Number,
      },
      web3: {
        account: mockAddress,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    store.clearActions()
    fireEvent.press(getByText('Toggle verification done'))
    fireEvent.press(getByText('Reset app opened state'))
    fireEvent.press(getByText('Toggle backup state'))
    fireEvent.press(getByText('Wipe Redux Store'))
    fireEvent.press(getByText('Valora Quick Reset'))

    expect(store.getActions()).toEqual([
      setNumberVerified(false),
      resetAppOpenedState(),
      toggleBackupState(),
      clearStoredAccount(mockAddress, true),
      clearStoredAccount(mockAddress),
    ])

    fireEvent.press(getByText('Show Debug Screen'))
    expect(navigate).toHaveBeenCalledWith(Screens.Debug)

    fireEvent.press(getByText('Trigger a crash'))
    expect(Sentry.nativeCrash).toHaveBeenCalled()
  })

  it('navigates to PincodeSet screen if entered PIN is correct', async () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    await act(() => {
      fireEvent.press(tree.getByTestId('ChangePIN'))
    })

    expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet, {
      changePin: true,
    })
  })

  it('does not navigate to PincodeSet screen if entered PIN is incorrect', async () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(false))
    await act(() => {
      fireEvent.press(tree.getByTestId('ChangePIN'))
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
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
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
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SettingsEvents.settings_biometry_opt_in_enable
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SettingsEvents.settings_biometry_opt_in_complete
    )

    await act(() => {
      fireEvent(getByTestId('useBiometryToggle'), 'valueChange', false)
    })

    expect(removeStoredPin).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual(
      expect.arrayContaining([setPincodeSuccess(PincodeType.CustomPin)])
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SettingsEvents.settings_biometry_opt_in_disable
    )
  })

  it('navigates to recovery phrase if entered PIN is correct', async () => {
    const store = createMockStore()

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    await act(() => {
      fireEvent.press(tree.getByTestId('RecoveryPhrase'))
    })

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_recovery_phrase)
    expect(navigate).toHaveBeenCalledWith(Screens.BackupIntroduction)
  })

  it('does not navigate to recovery phrase if entered PIN is incorrect', async () => {
    const store = createMockStore()

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(false))
    await act(() => {
      fireEvent.press(tree.getByTestId('RecoveryPhrase'))
    })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('does not show keyless backup', () => {
    const store = createMockStore()
    const { queryByTestId } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(queryByTestId('KeylessBackup')).toBeNull()
  })

  it('shows keyless backup setup when flag is enabled and not already backed up', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    const store = createMockStore({ account: { cloudBackupCompleted: false } })
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(getByTestId('KeylessBackup')).toBeTruthy()
    expect(getByText('setup')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('KeylessBackup'))
    })
    expect(navigate).toHaveBeenCalledWith(Screens.WalletSecurityPrimer)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(
      SettingsEvents.settings_set_up_keyless_backup
    )
  })

  it('shows keyless backup delete when flag is enabled and already backed up', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore({ account: { cloudBackupCompleted: true } })
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(getByTestId('KeylessBackup')).toBeTruthy()
    expect(getByText('delete')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackup'))
    expect(navigate).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(
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
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(getByTestId('KeylessBackup')).toBeTruthy()
    expect(getByText('pleaseWait')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackup'))
    expect(navigate).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
  })

  it('shows error banner when keyless backup delete fails', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore({
      account: { cloudBackupCompleted: true },
      keylessBackup: { showDeleteBackupError: true },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(getByTestId('KeylessBackupDeleteError')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('KeylessBackupDeleteError/dismiss'))
    })

    expect(store.getActions()).toContainEqual(hideDeleteKeylessBackupError())
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
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
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
        authorization: 'Valora 0x0000000000000000000000000000000000007e57:someSignedMessage',
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
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
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

  it('deletes the account and unlinks the phone number successfully', async () => {
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
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
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    fireEvent.press(tree.getByText('deleteAccountTitle'))
    fireEvent.press(tree.getByText('deleteAccountWarning.buttonLabel'))

    await waitFor(() =>
      expect(tree.getByText('deleteAccountWarning.buttonLabelRevokingPhoneNumber')).toBeTruthy()
    )

    expect(mockFetch).toHaveBeenNthCalledWith(1, `${networkConfig.revokePhoneNumberUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Valora 0x0000000000000000000000000000000000007e57:someSignedMessage',
      },
      body: '{"phoneNumber":"+14155550000","clientPlatform":"android","clientVersion":"0.0.1"}',
    })
    expect(navigate).toHaveBeenLastCalledWith(Screens.BackupPhrase, {
      settingsScreen: Screens.Settings,
    })
  })

  it('deletes the account for an unverified account successfully', async () => {
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    const store = createMockStore({
      app: { phoneNumberVerified: false },
    })

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    fireEvent.press(tree.getByText('deleteAccountTitle'))
    fireEvent.press(tree.getByText('deleteAccountWarning.buttonLabel'))

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(Screens.BackupPhrase, {
        settingsScreen: Screens.Settings,
      })
    )
    expect(mockFetch).not.toHaveBeenCalled()
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

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    // ignore dispatched actions on initial render
    store.clearActions()

    fireEvent.press(tree.getByText('deleteAccountTitle'))
    fireEvent.press(tree.getByText('deleteAccountWarning.buttonLabel'))

    await waitFor(() =>
      expect(tree.getByText('deleteAccountWarning.buttonLabelRevokingPhoneNumber')).toBeTruthy()
    )

    expect(mockFetch).toHaveBeenNthCalledWith(1, `${networkConfig.revokePhoneNumberUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Valora 0x0000000000000000000000000000000000007e57:someSignedMessage',
      },
      body: '{"phoneNumber":"+14155550000","clientPlatform":"android","clientVersion":"0.0.1"}',
    })
    expect(store.getActions()).toEqual([
      showError('revokePhoneNumber.revokeError' as ErrorMessages),
    ])
    expect(navigate).not.toHaveBeenCalled()
  })
})
