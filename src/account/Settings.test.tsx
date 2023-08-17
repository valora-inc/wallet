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
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  hapticFeedbackSet,
  resetAppOpenedState,
  setAnalyticsEnabled,
  setNumberVerified,
} from 'src/app/actions'
import { PRIVACY_LINK, TOS_LINK } from 'src/brandingConfig'
import { getKeylessBackupGate, isBackupComplete } from 'src/keylessBackup/utils'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { removeStoredPin, setPincodeWithBiometry } from 'src/pincode/authentication'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, flushMicrotasksQueue, getMockStackScreenProps } from 'test/utils'
import { mockE164Number, mockE164NumberPepper, mockTokenBalances } from 'test/values'
import { mocked } from 'ts-jest/utils'

const mockedEnsurePincode = ensurePincode as jest.Mock
const mockFetch = fetch as FetchMock
const mockedKeychain = mocked(Keychain)
mockedKeychain.getGenericPassword.mockResolvedValue({
  username: 'some username',
  password: 'someSignedMessage',
  service: 'some service',
  storage: 'some string',
})

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/utils/Logger')
jest.mock('src/keylessBackup/utils')

describe('Account', () => {
  beforeEach(() => {
    mocked(getKeylessBackupGate).mockReturnValue(false)
    mocked(isBackupComplete).mockReturnValue(false)
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

    expect(getByText('changePin')).toBeTruthy()
    expect(getByText('requirePinOnAppOpen')).toBeTruthy()
    expect(getByText('hapticFeedback')).toBeTruthy()
    expect(getByText('shareAnalytics')).toBeTruthy()

    expect(getByText('licenses')).toBeTruthy()
    expect(getByText('termsOfServiceLink')).toBeTruthy()
    expect(getByText('privacyPolicy')).toBeTruthy()

    expect(getByText('removeAccountTitle')).toBeTruthy()
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
    fireEvent.press(tree.getByTestId('ChangePIN'))
    await flushMicrotasksQueue()
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
    fireEvent.press(tree.getByTestId('ChangePIN'))
    await flushMicrotasksQueue()
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

    fireEvent(getByTestId('useBiometryToggle'), 'valueChange', true)
    await flushMicrotasksQueue()

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

    fireEvent(getByTestId('useBiometryToggle'), 'valueChange', false)
    await flushMicrotasksQueue()

    expect(removeStoredPin).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual(
      expect.arrayContaining([setPincodeSuccess(PincodeType.CustomPin)])
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SettingsEvents.settings_biometry_opt_in_disable
    )
  })

  it('renders correctly when shouldShowRecoveryPhraseInSettings is false', () => {
    const store = createMockStore({ app: { shouldShowRecoveryPhraseInSettings: false } })

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree.queryByTestId('RecoveryPhrase')).toBeFalsy()
  })

  it('renders correctly when shouldShowRecoveryPhraseInSettings is true', () => {
    const store = createMockStore({ app: { shouldShowRecoveryPhraseInSettings: true } })

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree.queryByTestId('RecoveryPhrase')).toBeTruthy()
  })

  it('navigates to recovery phrase if entered PIN is correct', async () => {
    const store = createMockStore({ app: { shouldShowRecoveryPhraseInSettings: true } })

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    fireEvent.press(tree.getByTestId('RecoveryPhrase'))
    await flushMicrotasksQueue()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_recovery_phrase)
    expect(navigate).toHaveBeenCalledWith(Screens.BackupIntroduction)
  })

  it('does not navigate to recovery phrase if entered PIN is incorrect', async () => {
    const store = createMockStore({ app: { shouldShowRecoveryPhraseInSettings: true } })

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(false))
    fireEvent.press(tree.getByTestId('RecoveryPhrase'))
    await flushMicrotasksQueue()
    expect(navigate).not.toHaveBeenCalled()
  })

  // TODO(ACT-771): update these tests to mock statsig instead of helper function
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
    mocked(getKeylessBackupGate).mockReturnValue(true)
    mocked(isBackupComplete).mockReturnValue(false)
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    const store = createMockStore()
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(getByTestId('KeylessBackup')).toBeTruthy()
    expect(getByText('setup')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackup'))
    await flushMicrotasksQueue()
    expect(navigate).toHaveBeenCalledWith(Screens.WalletSecurityPrimer)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(
      SettingsEvents.settings_set_up_keyless_backup
    )
  })

  it('shows keyless backup delete when flag is enabled and already backed up', () => {
    mocked(getKeylessBackupGate).mockReturnValue(true)
    mocked(isBackupComplete).mockReturnValue(true)
    const store = createMockStore()
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
})
