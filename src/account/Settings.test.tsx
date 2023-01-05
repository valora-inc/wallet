import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { Provider } from 'react-redux'
import { setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import Settings from 'src/account/Settings'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { removeStoredPin, setPincodeWithBiometry } from 'src/pincode/authentication'
import { Currency } from 'src/utils/currencies'
import { KomenciAvailable } from 'src/verify/reducer'
import { createMockStore, flushMicrotasksQueue, getMockStackScreenProps } from 'test/utils'
import { mockE164Number, mockE164NumberPepper } from 'test/values'

const mockedEnsurePincode = ensurePincode as jest.Mock

jest.mock('src/analytics/ValoraAnalytics')

const mockRevokePhoneNumber = jest.fn()
jest.mock('src/verify/hooks', () => ({
  useRevokeCurrentPhoneNumber: () => ({
    execute: mockRevokePhoneNumber,
    loading: false,
  }),
}))

describe('Account', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = render(
      <Provider
        store={createMockStore({
          account: {
            e164PhoneNumber: mockE164Number,
          },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balances: { [Currency.Dollar]: '0.00' } },
          goldToken: { balance: '0.00' },
          verify: {
            komenciAvailable: KomenciAvailable.Yes,
            komenci: { errorTimestamps: [] },
            status: {},
          },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when dev mode active', () => {
    const tree = render(
      <Provider
        store={createMockStore({
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balances: { [Currency.Dollar]: '0.00' } },
          goldToken: { balance: '0.00' },
          account: {
            devModeActive: true,
            e164PhoneNumber: mockE164Number,
          },
          verify: {
            komenci: { errorTimestamps: [] },
            komenciAvailable: KomenciAvailable.Yes,
            status: {},
          },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
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

  it('can trigger the action to revoke the phone number', async () => {
    const store = createMockStore({ account: { devModeActive: true } })

    const tree = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    fireEvent.press(tree.getByText('Revoke Number Verification (centralized)'))
    expect(mockRevokePhoneNumber).toHaveBeenCalled()
  })
})
